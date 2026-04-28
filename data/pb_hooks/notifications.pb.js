// Purchase request created → notify all admins
onRecordAfterCreateSuccess((e) => {
    try {
        let supplyName = "a supply";
        let unit = "";
        const supplyId = e.record.get("supplies");
        if (supplyId) {
            const supplies = e.app.findRecordsByFilter("supplies", `id = "${supplyId}"`, "", 1, 0);
            if (supplies.length > 0) {
                supplyName = supplies[0].get("name") || supplyName;
                unit = supplies[0].get("unit") || "";
            }
        }

        let requesterName = "Someone";
        const requesterId = e.record.get("requested_by");
        if (requesterId) {
            const requesters = e.app.findRecordsByFilter("users", `id = "${requesterId}"`, "", 1, 0);
            if (requesters.length > 0) {
                requesterName = requesters[0].get("name") || requesters[0].get("email") || requesterName;
            }
        }

        let branchName = "";
        const branchId = e.record.get("branch");
        if (branchId) {
            const branches = e.app.findRecordsByFilter("branches", `id = "${branchId}"`, "", 1, 0);
            if (branches.length > 0) branchName = branches[0].get("name") || "";
        }

        const qty = e.record.get("quantity");
        const body = requesterName + " requested " + qty + (unit ? " " + unit : "") + " of " + supplyName + ".";

        const col = e.app.findCollectionByNameOrId("notifications");
        const admins = e.app.findRecordsByFilter("users", 'role = "admin"', "", 100, 0);
        for (const admin of admins) {
            const notif = new Record(col, {
                recipient: admin.id,
                type: "pr_created",
                title: "New Purchase Request",
                body: body,
                href: "/restock",
                read: false,
                branch_name: branchName
            });
            e.app.save(notif);
        }
    } catch (err) {
        console.error("PR create notification error:", err);
    }
}, "purchase_requests");

// Purchase request status updated → notify the requester
onRecordAfterUpdateSuccess((e) => {
    try {
        const newStatus = e.record.get("status");
        const oldStatus = e.record.original().get("status");
        if (newStatus === oldStatus) return;

        const requesterId = e.record.get("requested_by");
        if (!requesterId) return;

        let supplyName = "your supply request";
        const supplyId = e.record.get("supplies");
        if (supplyId) {
            const supplies = e.app.findRecordsByFilter("supplies", `id = "${supplyId}"`, "", 1, 0);
            if (supplies.length > 0) supplyName = supplies[0].get("name") || supplyName;
        }

        let branchName = "";
        const branchId = e.record.get("branch");
        if (branchId) {
            const branches = e.app.findRecordsByFilter("branches", `id = "${branchId}"`, "", 1, 0);
            if (branches.length > 0) branchName = branches[0].get("name") || "";
        }

        const labels = { approved: "Approved", received: "Received", pending: "Pending" };
        const label = labels[newStatus] || newStatus;

        const col = e.app.findCollectionByNameOrId("notifications");
        const notif = new Record(col, {
            recipient: requesterId,
            type: "pr_updated",
            title: "Purchase Request " + label,
            body: "Your request for " + supplyName + " has been marked as " + label.toLowerCase() + ".",
            href: "/restock",
            read: false,
            branch_name: branchName
        });
        e.app.save(notif);
    } catch (err) {
        console.error("PR update notification error:", err);
    }
}, "purchase_requests");

// New user registered with no role → notify admins for approval
onRecordAfterCreateSuccess((e) => {
    try {
        if (e.record.get("role")) return;
        const name = e.record.get("name") || e.record.get("email");

        const col = e.app.findCollectionByNameOrId("notifications");
        const admins = e.app.findRecordsByFilter("users", 'role = "admin"', "", 100, 0);
        for (const admin of admins) {
            const notif = new Record(col, {
                recipient: admin.id,
                type: "user_pending",
                title: "New Staff Pending Approval",
                body: name + " just registered and is awaiting a role assignment.",
                href: "/management/staff",
                read: false,
                branch_name: ""
            });
            e.app.save(notif);
        }
    } catch (err) {
        console.error("User pending notification error:", err);
    }
}, "users");

// Branch stock update → notify admins on low/depleted crossing event
onRecordAfterUpdateSuccess((e) => {
    try {
        const newQty = e.record.get("quantity");
        const oldQty = e.record.original().get("quantity");
        if (newQty >= oldQty) return; // stock went up, skip

        let branchName = "";
        const branchId = e.record.get("branch");
        if (branchId) {
            const branches = e.app.findRecordsByFilter("branches", `id = "${branchId}"`, "", 1, 0);
            if (branches.length > 0) branchName = branches[0].get("name") || "";
        }

        const col = e.app.findCollectionByNameOrId("notifications");
        const admins = e.app.findRecordsByFilter("users", 'role = "admin"', "", 100, 0);

        const supplyId = e.record.get("supply");
        const productId = e.record.get("product");

        if (supplyId) {
            // Supplies: fire when quantity crosses below min_stock
            const rows = e.app.findRecordsByFilter("supplies", `id = "${supplyId}"`, "", 1, 0);
            if (rows.length === 0) return;
            const supply = rows[0];

            const minStock = supply.get("min_stock") || 0;
            if (newQty > minStock) return;   // still above threshold
            if (oldQty <= minStock) return;  // was already critical

            const unit = supply.get("unit") || "";
            const body = supply.get("name") + " is critically low (" + newQty + (unit ? " " + unit : "") + " remaining).";
            for (const admin of admins) {
                e.app.save(new Record(col, {
                    recipient: admin.id, type: "low_stock",
                    title: "Low Stock Alert", body: body,
                    href: "/restock", read: false,
                    branch_name: branchName
                }));
            }

        } else if (productId) {
            // Products have no min_stock — notify when stock hits 0 (depleted)
            if (newQty !== 0) return;  // only fire exactly when it reaches 0
            if (oldQty <= 0) return;   // was already depleted

            const rows = e.app.findRecordsByFilter("products", `id = "${productId}"`, "", 1, 0);
            if (rows.length === 0) return;
            const product = rows[0];

            const body = product.get("name") + " is now out of stock.";
            for (const admin of admins) {
                e.app.save(new Record(col, {
                    recipient: admin.id, type: "low_stock",
                    title: "Product Depleted", body: body,
                    href: "/inventory/products", read: false,
                    branch_name: branchName
                }));
            }
        }
    } catch (err) {
        console.error("Low stock notification error:", err);
    }
}, "branch_stocks");
