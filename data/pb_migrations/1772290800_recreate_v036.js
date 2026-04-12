migrate((app) => {
    // 1. Clean up first
    const names = ["equipments", "borrowing", "maintenance", "calibration"];
    for (const name of names) {
        try {
            const collection = app.findCollectionByNameOrId(name);
            app.delete(collection);
        } catch (e) {}
    }

    // 2. Re-create Equipment with v0.36 structure
    const eqColl = new Collection({
        name: "equipments",
        type: "base",
        fields: [
            { name: "id", type: "id" },
            { name: "name", type: "text", required: true, presentable: true },
            { name: "status", type: "select", options: { values: ["Available", "In Use", "Maintenance"] } },
            { name: "owner", type: "relation", options: { collectionId: "_pb_users_auth_", maxSelect: 1 } },
            { name: "created", type: "autodate" },
            { name: "updated", type: "autodate" }
        ],
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''"
    });
    app.save(eqColl);

    // 3. Add Dummy Data
    const equipments = ["Microscope X-100", "Centrifuge 5418", "Autoclave 50L"];
    for (const name of equipments) {
        const record = new Record(eqColl);
        record.set("name", name);
        record.set("status", "Available");
        app.save(record);
    }
}, (app) => {})
