migrate((app) => {
    const collection = app.findCollectionByNameOrId("equipments");
    
    // Clear and re-add fields using v0.36 syntax
    // name field
    const nameField = new TextField();
    nameField.name = "name";
    nameField.required = true;
    nameField.presentable = true;
    collection.fields.add(nameField);

    // status field
    const statusField = new SelectField();
    statusField.name = "status";
    statusField.values = ["Available", "In Use", "Maintenance"];
    collection.fields.add(statusField);

    // owner field
    const ownerField = new RelationField();
    ownerField.name = "owner";
    ownerField.collectionId = "_pb_users_auth_";
    ownerField.maxSelect = 1;
    collection.fields.add(ownerField);

    app.save(collection);

    // Now add data
    const names = ["Microscope X-100", "Centrifuge 5418", "Autoclave 50L"];
    for (const name of names) {
        const record = new Record(collection);
        record.set("name", name);
        record.set("status", "Available");
        app.save(record);
    }
}, (app) => {})
