migrate((app) => {
    const collection = app.findCollectionByNameOrId("equipments");
    
    // In v0.36, we access fields directly via collection.fields
    // Let's ensure 'name' is presentable
    const nameField = collection.fields.getByName("name");
    if (nameField) {
        nameField.presentable = true;
        app.save(collection);
    }

    // Now let's fix the data properly for v0.36
    const records = app.findAllRecords("equipments");
    const names = [
        "Microscope X-100", 
        "Centrifuge 5418", 
        "Autoclave 50L", 
        "pH Meter", 
        "Spectrophotometer", 
        "Analytical Balance"
    ];

    for (let i = 0; i < records.length; i++) {
        // Correct v0.36 setter
        records[i].set("name", names[i % names.length]);
        app.save(records[i]);
    }
}, (app) => {})
