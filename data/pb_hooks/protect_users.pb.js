// Block user deletion if they have any related records.
// Deactivate instead — set active=false via the Users page.
onRecordDeleteRequest((e) => {
    const userId = e.record.id;

    const checks = [
        { collection: "orders",            field: "cashier" },
        { collection: "finances",          field: "recorded_by" },
        { collection: "purchase_requests", field: "requested_by" },
        { collection: "attendance",        field: "user" },
        { collection: "inventory_logs",    field: "user" },
    ];

    for (const { collection, field } of checks) {
        try {
            const results = $app.findRecordsByFilter(
                collection,
                `${field} = "${userId}"`,
                "", 1, 0
            );
            if (results.length > 0) {
                throw new BadRequestError(
                    `Cannot delete this user — they have existing ${collection} records. Deactivate their account instead.`
                );
            }
        } catch (err) {
            if (err instanceof BadRequestError) throw err;
            // collection may not exist or field may differ — skip
        }
    }

    e.next();
}, "users");
