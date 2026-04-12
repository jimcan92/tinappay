/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = new Collection({
        name: "equipments",
        type: "base",
        schema: [
            { name: "name", type: "text", required: true },
            { name: "status", type: "select", options: { values: ["Available", "In Use", "Maintenance"] } },
            { name: "owner", type: "relation", options: { collectionId: "_pb_users_auth_", maxSelect: 1 } }
        ],
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
    });

    return app.save(collection);
})
