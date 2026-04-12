/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("equipments");

    // Add detailed fields for v0.36
    const fields = [
        { name: "make", type: "text" },
        { name: "model", type: "text" },
        { name: "serial_number", type: "text" },
        { name: "location", type: "text" },
        { name: "purchase_date", type: "date" },
        { name: "warranty_expiry", type: "date" },
        { name: "description", type: "text" }
    ];

    for (const f of fields) {
        let newField;
        if (f.type === "text") {
            newField = new TextField();
        } else if (f.type === "date") {
            newField = new DateField();
        }
        
        if (newField) {
            newField.name = f.name;
            collection.fields.add(newField);
        }
    }

    return app.save(collection);
}, (app) => {
    // Optional: add logic to remove fields if needed
})
