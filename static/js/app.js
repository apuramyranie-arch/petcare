
"use strict";

/* =====================================================
   PETCARE - STRAWBERRY PAWS
   COMPLETE FRONTEND JAVASCRIPT
   Flask + Firebase Cloud Firestore
===================================================== */

const API = "/api";

const $ = id => document.getElementById(id);


/* =====================================================
   1. COLLECTION SCHEMA
===================================================== */

const schema = {

    owners: {
        full_name: "text",
        phone: "tel",
        email: "email",
        address: "text"
    },

    pets: {
        name: "text",
        species: ["Dog", "Cat", "Bird", "Rabbit", "Other"],
        breed: "text",
        age: "number",
        sex: ["Male", "Female"],
        owner_id: "owners"
    },

    appointments: {
        owner_id: "owners",
        pet_id: "pets",
        date: "date",
        time: "time",
        service: "text",
        status: ["Scheduled", "Completed", "Cancelled"]
    }

};


const modules = {

    pets: {
        title: "Pet Profiles",
        singular: "Pet",
        description: "A little home for every adorable furry friend.",
        art: "puppy"
    },

    owners: {
        title: "Pet Owners",
        singular: "Owner",
        description: "Meet the wonderful people behind every happy paw.",
        art: "kitty"
    },

    appointments: {
        title: "Appointments",
        singular: "Appointment",
        description: "A little care today makes a happier tomorrow.",
        art: "calendar"
    }

};


const labels = {

    full_name: "Full Name",
    phone: "Phone Number",
    email: "Email Address",
    address: "Address",

    name: "Pet Name",
    species: "Species",
    breed: "Breed",
    age: "Age (Years)",
    sex: "Sex",
    owner_id: "Pet Owner",

    pet_id: "Pet Name",
    date: "Appointment Date",
    time: "Appointment Time",
    service: "Service",
    status: "Status"

};


const placeholders = {

    full_name: "e.g. Ana Santos",
    phone: "e.g. 09123456789",
    email: "e.g. owner@example.com",
    address: "e.g. Passi City, Iloilo",

    name: "e.g. Luna",
    breed: "e.g. Shih Tzu",
    age: "e.g. 2",

    service: "e.g. Vaccination"

};


/* =====================================================
   2. GLOBAL VARIABLES
===================================================== */

let page = "dashboard";

let data = {

    owners: [],
    pets: [],
    appointments: []

};

let editing = null;
let mode = "add";
let formKind = null;

let pendingDelete = null;

let loading = false;
let saving = false;
let deleting = false;
let connected = false;

let generation = 0;
let formGeneration = 0;

let noticeTimer = null;


/* =====================================================
   3. GENERAL HELPERS
===================================================== */

function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, char => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

    })[char]);

}


function createElement(tag, className, text) {

    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;

}


function today() {

    const now = new Date();

    const offset = now.getTimezoneOffset();

    return new Date(
        now.getTime() - offset * 60000
    ).toISOString().slice(0, 10);

}


function formatDate(value) {

    if (!value) return "—";

    const parsed = new Date(value + "T00:00:00");

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleDateString("en-PH", {

        year: "numeric",
        month: "short",
        day: "numeric"

    });

}


function formatTime(value) {

    if (!value) return "—";

    const [hour, minute] = String(value).split(":");

    const hours = Number(hour);

    if (!Number.isFinite(hours) || !minute) {
        return value;
    }

    return `${hours % 12 || 12}:${minute} ${
        hours >= 12 ? "PM" : "AM"
    }`;

}


function setCurrentDate() {

    $("currentDate").textContent =
        new Date().toLocaleDateString("en-PH", {

            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"

        });

}


function petIcon(species) {

    const icons = {

        Dog: "🐶",
        Cat: "🐱",
        Bird: "🐦",
        Rabbit: "🐰",
        Other: "🐾"

    };

    return icons[species] || "🐾";

}


/* =====================================================
   4. FIRESTORE API CONNECTION
===================================================== */

async function api(path, options = {}) {

    let response;

    try {

        response = await fetch(`${API}/${path}`, {

            ...options,

            headers: {

                "Content-Type": "application/json",
                ...(options.headers || {})

            }

        });

    } catch (error) {

        throw new Error(
            "Unable to connect to the server. " +
            "Please make sure Flask is running."
        );

    }

    let body;

    try {

        body = await response.json();

    } catch (error) {

        throw new Error(
            "The server returned an invalid response."
        );

    }

    if (!response.ok || body.success === false) {

        throw new Error(
            body.message || "The request failed."
        );

    }

    return body.data;

}


/* =====================================================
   5. CONNECTION STATUS
===================================================== */

function setConnection(state) {

    const element = $("connection");

    element.className = "connection";

    if (state === "online") {

        connected = true;

        element.classList.add("online");

        $("connectionText").textContent =
            "Firestore records loaded";

    } else if (state === "offline") {

        connected = false;

        element.classList.add("offline");

        $("connectionText").textContent =
            "Unable to load Firestore records";

    } else {

        connected = false;

        $("connectionText").textContent =
            "Connecting to Firestore...";

    }

}


/* =====================================================
   6. TOAST NOTIFICATIONS
===================================================== */

function notice(message, isError = false) {

    clearTimeout(noticeTimer);

    const element = $("notice");

    element.hidden = false;

    element.className = isError ? "error" : "success";

    $("noticeIcon").textContent = isError ? "!" : "♡";

    $("noticeTitle").textContent =
        isError ? "Something went wrong" : "Pawsome!";

    $("noticeText").textContent = message;

    noticeTimer = setTimeout(() => {

        element.hidden = true;

    }, 5000);

}


$("closeNotice").addEventListener("click", () => {

    $("notice").hidden = true;

    clearTimeout(noticeTimer);

});


/* =====================================================
   7. LOADING STATE
===================================================== */

function setLoading(value) {

    loading = value;

    $("records").classList.toggle("loading", value);

    $("records").setAttribute(
        "aria-busy",
        String(value)
    );

    $("add").disabled =
        value || !connected || saving || deleting;

    $("refresh").disabled =
        value || saving || deleting;

    document.querySelectorAll("[data-quick]")
        .forEach(button => {

            button.disabled =
                value || !connected || saving || deleting;

        });

}


/* =====================================================
   8. LOAD ALL FIRESTORE RECORDS
===================================================== */

async function refresh() {

    const token = ++generation;

    setLoading(true);

    try {

        const kinds = Object.keys(schema);

        const results = await Promise.all(

            kinds.map(kind => api(kind))

        );

        if (token !== generation) return false;

        if (results.some(result => !Array.isArray(result))) {

            throw new Error(
                "The server returned an unexpected record format."
            );

        }

        data = Object.fromEntries(

            kinds.map((kind, index) => [

                kind,
                results[index]

            ])

        );

        setConnection("online");

        renderStatistics();

        renderRecentAppointments();

        render();

        return true;

    } catch (error) {

        if (token === generation) {

            setConnection("offline");

            notice(error.message, true);

        }

        return false;

    } finally {

        if (token === generation) {

            setLoading(false);

        }

    }

}


/* =====================================================
   9. DASHBOARD STATISTICS
===================================================== */

function renderStatistics() {

    const container = $("stats");

    container.replaceChildren();

    const statistics = [

        {
            title: "Total Pets",
            value: data.pets.length,
            icon: "🐾",
            color: "pink",
            target: "pets",
            description: "Our lovely furry friends"
        },

        {
            title: "Pet Owners",
            value: data.owners.length,
            icon: "♡",
            color: "lavender",
            target: "owners",
            description: "Wonderful pet parents"
        },

        {
            title: "Appointments",
            value: data.appointments.length,
            icon: "📅",
            color: "peach",
            target: "appointments",
            description: "All veterinary visits"
        },

        {
            title: "Scheduled",
            value: data.appointments.filter(
                item => item.status === "Scheduled"
            ).length,
            icon: "◷",
            color: "yellow",
            target: "appointments",
            filter: "Scheduled",
            description: "Upcoming care visits"
        },

        {
            title: "Completed",
            value: data.appointments.filter(
                item => item.status === "Completed"
            ).length,
            icon: "✓",
            color: "green",
            target: "appointments",
            filter: "Completed",
            description: "Successful pet care visits"
        },

        {
            title: "Cancelled",
            value: data.appointments.filter(
                item => item.status === "Cancelled"
            ).length,
            icon: "×",
            color: "red",
            target: "appointments",
            filter: "Cancelled",
            description: "Cancelled appointments"
        }

    ];

    statistics.forEach((item, index) => {

        const card = createElement(
            "button",
            `stat stat-${item.color}`
        );

        card.type = "button";

        card.style.animationDelay = `${index * 45}ms`;

        const icon = createElement(
            "div",
            "stat-icon",
            item.icon
        );

        const value = createElement(
            "strong",
            "stat-value",
            item.value
        );

        const title = createElement(
            "span",
            "stat-title",
            item.title
        );

        const description = createElement(
            "small",
            "stat-description",
            item.description
        );

        card.append(
            icon,
            value,
            title,
            description
        );

        card.addEventListener("click", () => {

            navigate(
                item.target,
                item.filter || ""
            );

        });

        container.append(card);

    });

}


/* =====================================================
   10. DISPLAY LINKED FIRESTORE RECORDS
===================================================== */

function display(key, value) {

    if (key === "owner_id") {

        return data.owners.find(

            owner => owner.id === value

        )?.full_name || value || "Unknown owner";

    }

    if (key === "pet_id") {

        return data.pets.find(

            pet => pet.id === value

        )?.name || value || "Unknown pet";

    }

    if (key === "date") {
        return formatDate(value);
    }

    if (key === "time") {
        return formatTime(value);
    }

    return value ?? "—";

}


function statusBadge(status) {

    const allowed = [

        "Scheduled",
        "Completed",
        "Cancelled"

    ];

    const className = allowed.includes(status)

        ? status.toLowerCase()
        : "unknown";

    return createElement(

        "span",
        `status ${className}`,
        status || "Unknown"

    );

}


/* =====================================================
   11. RECENT APPOINTMENTS
===================================================== */

function renderRecentAppointments() {

    const rows = $("recentRows");

    rows.replaceChildren();

    const recent = [...data.appointments]

        .sort((a, b) => {

            const first =
                String(a.created_at || a.date || "");

            const second =
                String(b.created_at || b.date || "");

            return second.localeCompare(first);

        })

        .slice(0, 5);

    $("recentEmpty").hidden = recent.length > 0;

    recent.forEach(record => {

        const tr = document.createElement("tr");

        const keys = [

            "pet_id",
            "owner_id",
            "service",
            "date",
            "status"

        ];

        keys.forEach(key => {

            const td = document.createElement("td");

            if (key === "status") {

                td.append(statusBadge(record.status));

            } else {

                td.textContent = display(
                    key,
                    record[key]
                );

            }

            tr.append(td);

        });

        rows.append(tr);

    });

}


/* =====================================================
   12. RECORD TABLE RENDERING
===================================================== */

function render() {

    if (page === "dashboard") return;

    const keys = Object.keys(schema[page]);

    const query = $("search")
        .value
        .trim()
        .toLowerCase();

    const status = $("statusFilter").value;

    const records = data[page].filter(record => {

        const matchesSearch = keys.some(key => {

            const visible = String(

                display(key, record[key])

            ).toLowerCase();

            const raw = String(

                record[key] ?? ""

            ).toLowerCase();

            return visible.includes(query) ||
                raw.includes(query);

        });

        const matchesStatus =

            page !== "appointments" ||
            !status ||
            record.status === status;

        return matchesSearch && matchesStatus;

    });

    $("recordCount").textContent =

        `${records.length} ${
            records.length === 1 ? "record" : "records"
        }`;


    // TABLE HEADERS

    $("head").replaceChildren();

    const headerRow = document.createElement("tr");

    [...keys, "actions"].forEach(key => {

        const th = document.createElement("th");

        th.scope = "col";

        th.textContent = labels[key] || "Actions";

        headerRow.append(th);

    });

    $("head").append(headerRow);


    // TABLE RECORDS

    $("rows").replaceChildren();

    records.forEach(record => {

        const tr = document.createElement("tr");

        keys.forEach(key => {

            const td = document.createElement("td");

            if (key === "status") {

                td.append(statusBadge(record[key]));

            } else if (

                (page === "pets" && key === "name") ||

                (page === "owners" && key === "full_name")

            ) {

                const wrapper = createElement(
                    "div",
                    "record-name"
                );

                const avatar = createElement(

                    "span",
                    "record-avatar",

                    page === "pets"

                        ? petIcon(record.species)
                        : "♡"

                );

                const name = createElement(
                    "span",
                    "",
                    record[key]
                );

                wrapper.append(avatar, name);

                td.append(wrapper);

            } else {

                td.textContent = display(
                    key,
                    record[key]
                );

            }

            tr.append(td);

        });


        // CRUD BUTTONS

        const actions = createElement(
            "td",
            "actions"
        );

        const buttons = [

            {
                title: "◉ View",
                className: "view-btn",
                handler: () => openForm(
                    "view",
                    record.id
                )
            },

            {
                title: "✎ Edit",
                className: "edit-btn",
                handler: () => openForm(
                    "edit",
                    record.id
                )
            },

            {
                title: "× Delete",
                className: "delete-btn",
                handler: () => requestDelete(
                    record.id
                )
            }

        ];

        buttons.forEach(item => {

            const button = createElement(

                "button",
                item.className,
                item.title

            );

            button.type = "button";

            button.addEventListener(
                "click",
                item.handler
            );

            actions.append(button);

        });

        tr.append(actions);

        $("rows").append(tr);

    });


    // EMPTY RECORD STATE

    $("empty").hidden = records.length > 0;

    $("emptyText").textContent =

        query || status

            ? "Try another search or filter."

            : `Add your first ${
                modules[page].singular.toLowerCase()
            } record to get started.`;

}


/* =====================================================
   13. SIDEBAR NAVIGATION
===================================================== */

function navigate(target, filter = "") {

    if (
        target !== "dashboard" &&
        !schema[target]
    ) return false;

    if (saving || deleting) return false;

    formGeneration++;

    if ($("modal").open) {

        $("modal").close();

    }

    if ($("deleteModal").open) {

        $("deleteModal").close();

    }

    page = target;

    const isDashboard = target === "dashboard";

    $("heading").textContent = isDashboard

        ? "Hello, pet lover! ♡"

        : modules[target].title;

    $("welcome").hidden = !isDashboard;

    $("overview").hidden = !isDashboard;

    $("quickActions").hidden = !isDashboard;

    $("recentSection").hidden = !isDashboard;

    $("records").hidden = isDashboard;

    $("moduleBanner").hidden = isDashboard;

    $("search").value = "";

    $("statusFilter").value = filter;

    $("statusFilter").hidden =
        target !== "appointments";

    if (!isDashboard) {

        const module = modules[target];

        $("moduleTitle").textContent =
            module.title;

        $("moduleDescription").textContent =
            module.description;

        $("moduleArt").setAttribute(
            "href",
            `#${module.art}`
        );

        $("recordTitle").textContent =
            `Manage ${module.title}`;

        $("add").textContent =
            `+ Add ${module.singular}`;

        $("search").placeholder =
            `Search ${target}...`;

    }

    document.querySelectorAll("[data-page]")

        .forEach(button => {

            const active =
                button.dataset.page === target;

            button.classList.toggle(
                "active",
                active
            );

            if (active) {

                button.setAttribute(
                    "aria-current",
                    "page"
                );

            } else {

                button.removeAttribute(
                    "aria-current"
                );

            }

        });

    render();

    return true;

}


/* =====================================================
   14. SELECT FIELD OPTIONS
===================================================== */

function populateSelect(

    select,
    options,
    placeholder,
    selected = ""

) {

    select.replaceChildren();

    select.add(

        new Option(placeholder, "")

    );

    options.forEach(option => {

        select.add(

            new Option(
                option.name,
                option.value
            )

        );

    });

    select.value = selected ?? "";

}


/* =====================================================
   15. FILTER PETS BY OWNER
===================================================== */

function filterPets(selectedPet = "") {

    const ownerSelect = $("fields")

        .querySelector('[name="owner_id"]');

    const petSelect = $("fields")

        .querySelector('[name="pet_id"]');

    if (!ownerSelect || !petSelect) return;

    const ownerId = ownerSelect.value;

    const pets = data.pets.filter(

        pet => pet.owner_id === ownerId

    );

    const options = pets.map(pet => ({

        name: `${pet.name} (${pet.breed})`,

        value: pet.id

    }));

    populateSelect(

        petSelect,

        options,

        !ownerId

            ? "Select an owner first"

            : pets.length

                ? "Select Pet"

                : "No pets registered for this owner",

        selectedPet

    );

    petSelect.disabled =

        mode === "view" ||
        !ownerId ||
        pets.length === 0;

}


/* =====================================================
   16. FORM ERROR MESSAGE
===================================================== */

function formError(message = "") {

    $("formError").textContent = message;

    $("formError").hidden = !message;

}


/* =====================================================
   17. ADD, EDIT AND VIEW RECORDS
===================================================== */

async function openForm(action, id = null) {

    if (loading || saving || deleting) return;

    if (!connected) {

        notice(
            "Please connect to Firestore first.",
            true
        );

        return;

    }

    const kind = page;

    if (!schema[kind]) return;

    const token = ++formGeneration;

    try {

        if (

            action === "add" &&
            kind === "pets" &&
            data.owners.length === 0

        ) {

            throw new Error(

                "Register a pet owner before adding a pet."

            );

        }

        if (

            action === "add" &&
            kind === "appointments" &&
            data.pets.length === 0

        ) {

            throw new Error(

                "Register a pet before scheduling an appointment."

            );

        }

        const record = id

            ? await api(
                `${kind}/${encodeURIComponent(id)}`
            )

            : {};

        if (

            page !== kind ||
            token !== formGeneration

        ) return;

        mode = action;

        editing = id;

        formKind = kind;

        formError();

        const titles = {

            add: "Add New",
            edit: "Edit",
            view: "View"

        };

        $("modalTitle").textContent =

            `${titles[action]} ${modules[kind].singular}`;

        $("fields").replaceChildren();


        // GENERATE FORM FIELDS

        for (

            const [key, type] of
            Object.entries(schema[kind])

        ) {

            const wrapper = createElement(
                "label",
                "form-group"
            );

            const fieldLabel = createElement(

                "span",
                "field-label",
                labels[key]

            );

            wrapper.append(fieldLabel);

            let input;


            // SELECT FIELDS

            if (

                Array.isArray(type) ||
                type === "owners" ||
                type === "pets"

            ) {

                input = document.createElement("select");

                let options = [];

                if (Array.isArray(type)) {

                    options = type.map(value => ({

                        name: value,
                        value: value

                    }));

                } else {

                    options = data[type].map(item => ({

                        name: item.full_name || item.name,

                        value: item.id

                    }));

                }

                populateSelect(

                    input,

                    options,

                    `Select ${labels[key]}`,

                    record[key] ?? ""

                );

            } else {


                // TEXT AND NUMBER FIELDS

                input = document.createElement("input");

                input.type = type;

                input.placeholder =
                    placeholders[key] || "";

                input.value = record[key] ?? "";

                if (type === "number") {

                    input.min = "0";

                    input.max = "100";

                    input.step = "1";

                } else {

                    input.maxLength = 300;

                }

            }


            // DEFAULT APPOINTMENT VALUES

            if (action === "add") {

                if (key === "date") {

                    input.value = today();

                }

                if (key === "time") {

                    input.value = "09:00";

                }

                if (key === "status") {

                    input.value = "Scheduled";

                }

            }

            input.name = key;

            input.id = `field-${key}`;

            input.required = true;

            input.disabled = action === "view";

            input.autocomplete = "off";

            wrapper.append(input);

            $("fields").append(wrapper);

        }


        // LINK OWNER AND PET DROPDOWNS

        if (kind === "appointments") {

            const ownerSelect = $("fields")

                .querySelector('[name="owner_id"]');

            ownerSelect.addEventListener(

                "change",

                () => filterPets()

            );

            filterPets(record.pet_id || "");

        }


        // MODAL BUTTON STATES

        $("save").hidden = action === "view";

        $("save").disabled = false;

        $("save").textContent =

            action === "edit"

                ? "♡ Save Changes"

                : `♡ Add ${modules[kind].singular}`;

        $("cancel").textContent =

            action === "view"

                ? "Close"

                : "Cancel";

        if (!$("modal").open) {

            $("modal").showModal();

        }

    } catch (error) {

        notice(error.message, true);

    }

}


/* =====================================================
   18. CREATE AND UPDATE RECORDS
===================================================== */

$("form").addEventListener("submit", async event => {

    event.preventDefault();

    if (mode === "view" || saving) return;

    if (!formKind || !schema[formKind]) return;

    if (!$("form").reportValidity()) return;

    formError();

    const kind = formKind;

    const recordId = editing;

    const values = Object.fromEntries(

        new FormData(event.target)

    );


    // TRIM TEXT VALUES

    Object.keys(values).forEach(key => {

        if (typeof values[key] === "string") {

            values[key] = values[key].trim();

        }

    });


    // REQUIRED FIELD VALIDATION

    for (const key of Object.keys(schema[kind])) {

        if (

            values[key] === undefined ||
            values[key] === ""

        ) {

            formError(`${labels[key]} is required.`);

            return;

        }

    }


    // AGE VALIDATION

    if ("age" in values) {

        values.age = Number(values.age);

        if (

            !Number.isInteger(values.age) ||
            values.age < 0 ||
            values.age > 100

        ) {

            formError(
                "Age must be a whole number from 0 to 100."
            );

            return;

        }

    }


    // PHONE NUMBER VALIDATION

    if ("phone" in values) {

        const digits = values.phone.replace(/\D/g, "");

        if (

            digits.length < 7 ||
            digits.length > 15 ||
            !/^[+0-9 ()-]+$/.test(values.phone)

        ) {

            formError(
                "Please enter a valid phone number."
            );

            return;

        }

    }


    // EMAIL VALIDATION

    if ("email" in values) {

        const pattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!pattern.test(values.email)) {

            formError(
                "Please enter a valid email address."
            );

            return;

        }

    }


    // PET AND OWNER RELATIONSHIP VALIDATION

    if (kind === "pets") {

        const ownerExists = data.owners.some(

            owner => owner.id === values.owner_id

        );

        if (!ownerExists) {

            formError(
                "Please select an existing pet owner."
            );

            return;

        }

    }


    // APPOINTMENT RELATIONSHIP VALIDATION

    if (kind === "appointments") {

        const selectedPet = data.pets.find(

            pet => pet.id === values.pet_id

        );

        if (

            !selectedPet ||
            selectedPet.owner_id !== values.owner_id

        ) {

            formError(

                "Select a pet belonging to the selected owner."

            );

            return;

        }

    }


    // SAVE TO FIRESTORE

    saving = true;

    const originalText = $("save").textContent;

    $("save").disabled = true;

    $("cancel").disabled = true;

    $("save").textContent = "Saving... ♡";

    try {

        const path = recordId

            ? `${kind}/${encodeURIComponent(recordId)}`

            : kind;

        await api(path, {

            method: recordId ? "PUT" : "POST",

            body: JSON.stringify(values)

        });

        $("modal").close();

        const refreshed = await refresh();

        if (refreshed) {

            notice(

                recordId

                    ? `${modules[kind].singular} updated successfully!`

                    : `${modules[kind].singular} added successfully!`

            );

        } else {

            notice(
                "Record saved, but the list could not be refreshed.",
                true
            );

        }

    } catch (error) {

        formError(error.message);

    } finally {

        saving = false;

        $("save").disabled = false;

        $("cancel").disabled = false;

        $("save").textContent = originalText;

        setLoading(false);

    }

});


/* =====================================================
   19. DELETE CONFIRMATION
===================================================== */

function requestDelete(id) {

    if (

        loading ||
        saving ||
        deleting ||
        !connected

    ) return;

    const kind = page;

    const record = data[kind]?.find(

        item => item.id === id

    );

    if (!record) return;


    // PREVENT DELETING LINKED OWNERS

    if (kind === "owners") {

        const linkedPets = data.pets.some(

            pet => pet.owner_id === id

        );

        const linkedAppointments = data.appointments.some(

            appointment => appointment.owner_id === id

        );

        if (linkedPets || linkedAppointments) {

            notice(

                "This owner has linked pets or appointments. " +
                "Remove or update those records first.",

                true

            );

            return;

        }

    }


    // PREVENT DELETING LINKED PETS

    if (kind === "pets") {

        const linkedAppointments = data.appointments.some(

            appointment => appointment.pet_id === id

        );

        if (linkedAppointments) {

            notice(

                "This pet has linked appointments. " +
                "Remove those appointments first.",

                true

            );

            return;

        }

    }

    const name =

        record.full_name ||
        record.name ||
        record.service ||
        "this record";

    pendingDelete = {

        kind,
        id

    };

    $("deleteMessage").textContent =

        `Are you sure you want to delete ${name}?`;

    $("deleteModal").showModal();

}


/* =====================================================
   20. DELETE FIRESTORE RECORD
===================================================== */

$("confirmDelete").addEventListener("click", async () => {

    if (!pendingDelete || deleting) return;

    const {kind, id} = pendingDelete;

    deleting = true;

    $("confirmDelete").disabled = true;

    $("cancelDelete").disabled = true;

    $("confirmDelete").textContent = "Deleting...";

    try {

        await api(

            `${kind}/${encodeURIComponent(id)}`,

            {

                method: "DELETE"

            }

        );

        $("deleteModal").close();

        const refreshed = await refresh();

        if (refreshed) {

            notice(

                `${modules[kind].singular} deleted successfully.`

            );

        } else {

            notice(

                "Record deleted, but the list could not be refreshed.",

                true

            );

        }

    } catch (error) {

        $("deleteMessage").textContent =
            error.message;

    } finally {

        deleting = false;

        $("confirmDelete").disabled = false;

        $("cancelDelete").disabled = false;

        $("confirmDelete").textContent =
            "Delete Record";

        setLoading(false);

    }

});


$("cancelDelete").addEventListener("click", () => {

    if (deleting) return;

    $("deleteModal").close();

});


$("deleteModal").addEventListener("close", () => {

    pendingDelete = null;

});


$("deleteModal").addEventListener("cancel", event => {

    if (deleting) {

        event.preventDefault();

    }

});


/* =====================================================
   21. MODAL EVENTS
===================================================== */

$("cancel").addEventListener("click", () => {

    if (saving) return;

    formGeneration++;

    $("modal").close();

});


$("modal").addEventListener("cancel", event => {

    if (saving) {

        event.preventDefault();

    }

});


$("modal").addEventListener("close", () => {

    $("form").reset();

    editing = null;

    formKind = null;

    mode = "add";

    formError();

});


/* =====================================================
   22. SEARCH AND FILTER EVENTS
===================================================== */

$("search").addEventListener(

    "input",

    render

);


$("statusFilter").addEventListener(

    "change",

    render

);


/* =====================================================
   23. ADD RECORD BUTTON
===================================================== */

$("add").addEventListener("click", () => {

    openForm("add");

});


/* =====================================================
   24. SIDEBAR NAVIGATION EVENTS
===================================================== */

document.querySelectorAll("[data-page]")

    .forEach(button => {

        button.addEventListener("click", () => {

            navigate(button.dataset.page);

        });

    });


/* =====================================================
   25. QUICK ACTION BUTTONS
===================================================== */

document.querySelectorAll("[data-quick]")

    .forEach(button => {

        button.addEventListener("click", () => {

            if (

                loading ||
                saving ||
                deleting

            ) return;

            if (navigate(button.dataset.quick)) {

                openForm("add");

            }

        });

    });


/* =====================================================
   26. VIEW ALL BUTTONS
===================================================== */

document.querySelectorAll("[data-go]")

    .forEach(button => {

        button.addEventListener("click", () => {

            navigate(button.dataset.go);

        });

    });


/* =====================================================
   27. REFRESH BUTTON
===================================================== */

$("refresh").addEventListener("click", async () => {

    if (loading || saving || deleting) return;

    const success = await refresh();

    if (success) {

        notice("Your PetCare records are up to date!");

    }

});


/* =====================================================
   28. INITIALIZE PETCARE
===================================================== */

async function initialize() {

    setCurrentDate();

    setConnection("connecting");

    navigate("dashboard");

    await refresh();

}

initialize();
