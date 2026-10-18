const jsonResponse = (status, body) => new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
});

const allowedOrigins = new Set([
    "https://owenscott.us",
    "https://www.owenscott.us"
]);

export default async (request) => {
    if (request.method !== "POST") {
        return jsonResponse(405, { error: "Method not allowed." });
    }

    const origin = request.headers.get("origin");
    if (!origin || !allowedOrigins.has(origin)) {
        return jsonResponse(403, { error: "Request origin is not allowed." });
    }

    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
        return jsonResponse(415, { error: "Expected a JSON request." });
    }

    let submission;
    try {
        submission = await request.json();
    } catch {
        return jsonResponse(400, { error: "Invalid request." });
    }

    if (!submission || typeof submission !== "object") {
        return jsonResponse(400, { error: "Invalid request." });
    }

    // Silently accept bot submissions that fill the hidden honeypot field.
    if (typeof submission.website === "string" && submission.website.trim()) {
        return jsonResponse(200, { ok: true });
    }

    const name = typeof submission.name === "string" ? submission.name.trim() : "";
    const email = typeof submission.email === "string" ? submission.email.trim() : "";
    const message = typeof submission.message === "string" ? submission.message.trim() : "";

    if (
        name.length < 1 || name.length > 100 ||
        email.length < 3 || email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        message.length < 1 || message.length > 5000
    ) {
        return jsonResponse(400, { error: "Check the form fields and try again." });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !publishableKey) {
        console.error("Contact form is missing its Supabase environment configuration.");
        return jsonResponse(503, { error: "The contact form is temporarily unavailable." });
    }

    try {
        const response = await fetch(supabaseUrl.replace(/\/$/, "") + "/rest/v1/contact_submissions", {
            method: "POST",
            headers: {
                "apikey": publishableKey,
                "Authorization": "Bearer " + publishableKey,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            },
            body: JSON.stringify({ name, email, message })
        });

        if (!response.ok) {
            console.error("Supabase rejected a contact submission with status " + response.status + ".");
            return jsonResponse(502, { error: "The message could not be stored." });
        }

        return jsonResponse(200, { ok: true });
    } catch {
        console.error("Could not reach Supabase while processing a contact submission.");
        return jsonResponse(502, { error: "The message could not be stored." });
    }
};
