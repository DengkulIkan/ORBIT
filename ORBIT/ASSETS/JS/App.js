const initialAssets = [
    {
        id: "ORB-1001",
        name: "ThinkPad E14 Gen 5",
        category: "Laptop",
        serial: "DEMO-LT-001",
        assignedTo: "Alex Morgan",
        condition: "Good",
        status: "In Use"
    },
    {
        id: "ORB-1002",
        name: "Dell OptiPlex 7010",
        category: "Desktop",
        serial: "DEMO-PC-002",
        assignedTo: "Jamie Lee",
        condition: "Good",
        status: "In Use"
    },
    {
        id: "ORB-1003",
        name: "Dell UltraSharp U2422H",
        category: "Monitor",
        serial: "DEMO-MN-003",
        assignedTo: "Jamie Lee",
        condition: "Fair",
        status: "In Use"
    },
    {
        id: "ORB-1004",
        name: "Cisco Catalyst Switch",
        category: "Network",
        serial: "DEMO-NW-004",
        assignedTo: "IT Department",
        condition: "Good",
        status: "Available"
    },
    {
        id: "ORB-1005",
        name: "HP LaserJet Pro",
        category: "Printer",
        serial: "DEMO-PR-005",
        assignedTo: "Unassigned",
        condition: "Needs Repair",
        status: "Maintenance"
    },
    {
        id: "ORB-1006",
        name: "Dell PowerEdge R550",
        category: "Server",
        serial: "DEMO-SV-006",
        assignedTo: "Infrastructure Team",
        condition: "Good",
        status: "In Use"
    }
];

const $ = id => document.getElementById(id);

function loadAssets() {
    try {
        const saved = localStorage.getItem("orbit-assets");

        if (saved === null) return initialAssets;

        const parsed = JSON.parse(saved);

        return Array.isArray(parsed) ? parsed : initialAssets;
    } catch {
        return initialAssets;
    }
}

let assets = loadAssets();

let activities = [
    {
        text: "ORBIT inventory initialized with sample data",
        time: "System initialization"
    }
];

function saveAssets() {
    localStorage.setItem("orbit-assets", JSON.stringify(assets));
}

function updateStats() {
    $("totalAssets").textContent = assets.length;

    $("inUseAssets").textContent =
        assets.filter(a => a.status === "In Use").length;

    $("availableAssets").textContent =
        assets.filter(a => a.status === "Available").length;

    $("maintenanceAssets").textContent =
        assets.filter(a => a.status === "Maintenance").length;
}

function createBadge(value) {
    const badge = document.createElement("span");

    badge.className = "badge " + value.replaceAll(" ", "-");
    badge.textContent = value;

    return badge;
}

function renderAssets() {
    const query = $("searchInput").value.trim().toLowerCase();
    const category = $("categoryFilter").value;
    const status = $("statusFilter").value;

    const filtered = assets.filter(asset => {
        const searchable = [
            asset.id,
            asset.name,
            asset.serial,
            asset.assignedTo
        ].join(" ").toLowerCase();

        return searchable.includes(query)
            && (!category || asset.category === category)
            && (!status || asset.status === status);
    });

    const table = $("assetTable");
    table.replaceChildren();

    if (filtered.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 6;
        cell.textContent = "No matching assets found.";

        row.appendChild(cell);
        table.appendChild(row);
    }

    filtered.forEach(asset => {
        const row = document.createElement("tr");

        const values = [
            asset.id,
            asset.name,
            asset.category,
            asset.assignedTo || "Unassigned"
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const conditionCell = document.createElement("td");
        conditionCell.appendChild(createBadge(asset.condition));
        row.appendChild(conditionCell);

        const statusCell = document.createElement("td");
        statusCell.appendChild(createBadge(asset.status));
        row.appendChild(statusCell);

        table.appendChild(row);
    });

    $("resultCount").textContent =
        `Showing ${filtered.length} of ${assets.length} assets`;

    updateStats();
}

function renderActivities() {
    const container = $("activityList");
    container.replaceChildren();

    [...activities].reverse().forEach(activity => {
        const item = document.createElement("div");
        item.className = "activity-item";

        const description = document.createElement("div");
        description.textContent = activity.text;

        const time = document.createElement("small");
        time.textContent = activity.time;

        item.append(description, time);
        container.appendChild(item);
    });
}

function addActivity(message) {
    activities.push({
        text: message,
        time: new Date().toLocaleString()
    });

    renderActivities();
}

function registerAsset(event) {
    event.preventDefault();

    const name = $("assetName").value.trim();
    const serial = $("assetSerial").value.trim();

    if (!name || !serial) return;

    const duplicate = assets.some(
        asset => asset.serial.toLowerCase() === serial.toLowerCase()
    );

    if (duplicate) {
        alert("This serial number already exists.");
        return;
    }

    const number = Math.max(
        1000,
        ...assets.map(asset =>
            Number(asset.id.split("-")[1]) || 1000
        )
    ) + 1;

    const assignedTo = $("assetUser").value.trim();

    let status = $("assetStatus").value;

    if (status === "In Use" && !assignedTo) {
        alert("Enter an assignee for an asset marked In Use.");
        return;
    }

    const asset = {
        id: `ORB-${number}`,
        name,
        category: $("assetCategory").value,
        serial,
        assignedTo: assignedTo || "Unassigned",
        condition: $("assetCondition").value,
        status
    };

    assets.unshift(asset);
    saveAssets();

    addActivity(`Asset ${asset.id} registered: ${asset.name}`);

    renderAssets();

    $("assetForm").reset();
    $("assetDialog").close();
}

function exportCSV() {
    const headers = [
        "Asset ID",
        "Device",
        "Category",
        "Serial Number",
        "Assigned To",
        "Condition",
        "Status"
    ];

    const rows = assets.map(asset => [
        asset.id,
        asset.name,
        asset.category,
        asset.serial,
        asset.assignedTo,
        asset.condition,
        asset.status
    ]);

    const escapeCSV = value =>
        `"${String(value).replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
        .map(row => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "orbit-asset-inventory.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

$("searchInput").addEventListener("input", renderAssets);
$("categoryFilter").addEventListener("change", renderAssets);
$("statusFilter").addEventListener("change", renderAssets);

$("addAssetBtn").addEventListener("click", () => {
    $("assetDialog").showModal();
});

$("closeDialogBtn").addEventListener("click", () => {
    $("assetDialog").close();
});

$("cancelDialogBtn").addEventListener("click", () => {
    $("assetDialog").close();
});

$("assetForm").addEventListener("submit", registerAsset);
$("exportBtn").addEventListener("click", exportCSV);

renderAssets();
renderActivities();
