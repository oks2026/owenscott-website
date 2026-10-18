const form = document.querySelector("#contact-form");
const statusMessage = document.querySelector("#contact-status");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
        return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const submission = {
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        message: String(formData.get("message") || "").trim(),
        website: String(formData.get("website") || "").trim()
    };

    submitButton.disabled = true;
    statusMessage.textContent = "Sending your message…";

    try {
        const response = await fetch("/.netlify/functions/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submission)
        });

        if (!response.ok) {
            throw new Error("The message could not be sent.");
        }

        form.reset();
        statusMessage.textContent = "Thanks for reaching out. Your message was sent.";
    } catch {
        statusMessage.textContent = "Sorry, the form couldn't send your message. Please email owen@owenscott.us.";
    } finally {
        submitButton.disabled = false;
    }
});
