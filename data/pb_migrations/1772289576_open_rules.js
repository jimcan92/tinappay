/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collections = ["equipments", "borrowing", "maintenance", "calibration"];
    
    for (const name of collections) {
        try {
            const collection = app.findCollectionByNameOrId(name);
            collection.listRule = ""; // Public
            collection.viewRule = ""; // Public
            app.save(collection);
        } catch (e) {}
    }
})
