migrate((app) => {
    // 1. Create Locations Collection
    const locations = new Collection({
        name: "locations",
        type: "base",
        fields: [
            { name: "id", type: "id" },
            { name: "building", type: "text", required: true, presentable: true },
            { name: "room", type: "text", required: true, presentable: true },
            { name: "cabinet", type: "text" },
            { name: "compartment", type: "text" },
            { name: "created", type: "autodate" },
            { name: "updated", type: "autodate" }
        ],
        listRule: "", viewRule: "", createRule: "@request.auth.id != ''", updateRule: "@request.auth.id != ''", deleteRule: "@request.auth.id != ''"
    });
    app.save(locations);

    // 2. Update Equipments Collection
    const equipments = app.findCollectionByNameOrId("equipments");
    
    // Add missing fields from labsys
    const newFields = [
        { name: "asset_tag", type: "text" },
        { name: "responsible_person", type: "text" },
        { name: "notes", type: "text" },
        { name: "last_maintenance_date", type: "date" },
        { name: "next_maintenance_date", type: "date" },
        { name: "calibration_date", type: "date" },
        { name: "calibration_due_date", type: "date" }
    ];

    for (const f of newFields) {
        let field;
        if (f.type === "text") field = new TextField();
        else if (f.type === "date") field = new DateField();
        field.name = f.name;
        equipments.fields.add(field);
    }

    // Add Condition Select
    const condField = new SelectField();
    condField.name = "condition";
    condField.values = ["Excellent", "Good", "Fair", "Poor", "Damaged"];
    equipments.fields.add(condField);

    // Add Relation to Locations
    const locRelation = new RelationField();
    locRelation.name = "location_ref"; // using different name to avoid conflict with existing 'location' text field
    locRelation.collectionId = locations.id;
    locRelation.maxSelect = 1;
    equipments.fields.add(locRelation);

    return app.save(equipments);
}, (app) => {})
