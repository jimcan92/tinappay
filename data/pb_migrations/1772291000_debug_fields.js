migrate((app) => {
    const collection = app.findCollectionByNameOrId("equipments");
    const fields = collection.fields;
    console.log("FIELDS: " + fields.length);
    for (const f of fields) {
        console.log(" - " + f.name + " (" + f.type + ")");
    }
}, (app) => {})
