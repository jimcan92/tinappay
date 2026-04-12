migrate((app) => {
    const collections = ["equipments", "borrowing", "maintenance", "calibration"];
    
    for (const name of collections) {
        try {
            const collection = app.findCollectionByNameOrId(name);
            // Ensure rules are truly public
            collection.listRule = ""; 
            collection.viewRule = "";
            app.save(collection);
        } catch (e) {}
    }
}, (app) => {})
