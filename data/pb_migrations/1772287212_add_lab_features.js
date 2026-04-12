/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    // 1. Borrowing Collection
    const borrowing = new Collection({
        name: "borrowing",
        type: "base",
        schema: [
            { name: "equipment", type: "relation", required: true, options: { collectionId: "equipments", maxSelect: 1 } },
            { name: "borrower_name", type: "text", required: true },
            { name: "borrow_date", type: "date", required: true },
            { name: "return_date", type: "date" },
            { name: "status", type: "select", required: true, options: { values: ["Borrowed", "Returned"] } }
        ],
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
    });
    app.save(borrowing);

    // 2. Maintenance (PMS) Collection
    const maintenance = new Collection({
        name: "maintenance",
        type: "base",
        schema: [
            { name: "equipment", type: "relation", required: true, options: { collectionId: "equipments", maxSelect: 1 } },
            { name: "task_description", type: "text", required: true },
            { name: "scheduled_date", type: "date", required: true },
            { name: "completed_date", type: "date" },
            { name: "status", type: "select", required: true, options: { values: ["Pending", "In Progress", "Completed"] } }
        ],
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
    });
    app.save(maintenance);

    // 3. Calibration Collection
    const calibration = new Collection({
        name: "calibration",
        type: "base",
        schema: [
            { name: "equipment", type: "relation", required: true, options: { collectionId: "equipments", maxSelect: 1 } },
            { name: "last_calibrated", type: "date", required: true },
            { name: "next_due", type: "date", required: true },
            { name: "certificate_ref", type: "text" },
            { name: "status", type: "select", required: true, options: { values: ["Valid", "Expired", "Failed"] } }
        ],
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
    });
    return app.save(calibration);
})
