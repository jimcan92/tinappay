migrate((app) => {
    const equipments = [
        { name: "TEST-Public-Microscope", status: "Available" },
        { name: "TEST-Public-Centrifuge", status: "Available" }
    ];
    const eqColl = app.findCollectionByNameOrId("equipments");
    for (const eq of equipments) {
        const record = new Record(eqColl);
        record.set("name", eq.name);
        record.set("status", eq.status);
        app.save(record);
    }
}, (app) => {})
