onRecordAfterCreateSuccess((e) => {
    if (e.record.emailVisibility()) return;
    e.record.set('emailVisibility', true);
    e.app.save(e.record);
}, 'users');
