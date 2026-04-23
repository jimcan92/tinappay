// Runs every midnight — closes any attendance records that were never clocked out
cronAdd("auto_close_attendance", "1 0 * * *", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().replace('T', ' ').split('.')[0];

    // End-of-day for yesterday
    const yesterday = new Date(today.getTime() - 60000); // 23:59 of previous day
    const closeTime = yesterday.toISOString().replace('T', ' ').split('.')[0];

    try {
        const records = $app.findRecordsByFilter(
            "attendance",
            `clock_out = "" && clock_in < "${todayStr}"`,
            "-clock_in",
            500,
            0
        );
        for (const r of records) {
            r.set("clock_out", closeTime);
            $app.save(r);
        }
    } catch (_) {
        // no unclosed records
    }
});
