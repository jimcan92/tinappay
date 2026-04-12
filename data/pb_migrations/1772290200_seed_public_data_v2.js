migrate((app) => {
    const eqColl = app.findCollectionByNameOrId("equipments");
    const records = app.findAllRecords(eqColl);
    for (const record of records) {
        app.delete(record);
    }
    const equipments = [
        "Digital Microscope X-100", 
        "Centrifuge Model 5418", 
        "Autoclave Sterilizer 50L", 
        "pH Meter - Laboratory Grade", 
        "Spectrophotometer UV-VIS", 
        "Analytical Balance 0.1mg"
    ];
    for (const name of equipments) {
        const record = new Record(eqColl);
        record.set("name", name);
        record.set("status", "Available");
        app.save(record);
    }
}, (app) => {})
