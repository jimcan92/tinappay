migrate((app) => {
    const records = app.findAllRecords("equipments");
    const names = ["Microscope X-100", "Centrifuge 5418", "Autoclave 50L", "pH Meter", "Spectrophotometer", "Analytical Balance"];
    
    for (let i = 0; i < records.length; i++) {
        records[i].set("name", names[i % names.length]);
        records[i].set("status", "Available");
        app.save(records[i]);
    }
}, (app) => {})
