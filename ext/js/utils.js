

function saveButton() {

    document.getElementById('saveBtn').addEventListener('click', () => {
    const mark = {
        name: document.getElementById('name')?.value,
        email: document.getElementById('email')?.value,
        title: document.getElementById('title')?.value,
        org: document.getElementById('org')?.value,
        location: document.getElementById('location')?.value,

        phone: document.getElementById('phone')?.value,
        email: document.getElementById('email')?.value,
        linkedin: document.getElementById('linkedin')?.value,
        on_x: document.getElementById('on_x')?.value,


        notes: document.getElementById('notes')?.value,
        createdAt: new Date().toISOString(),
        lastContact: new Date().toISOString(),
        outreachCount: 0
    };

    fetch("http://localhost:3000/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mark)
    })
    .then(res => res.json())
    .then(data => {
        console.log("Mark saved:", data);
    })
    .catch(err => console.error("Failed to save mark:", err));
    })

}