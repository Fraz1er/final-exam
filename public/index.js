// DOM Elements
const customerForm = document.getElementById('customerForm');
const customerIdInput = document.getElementById('customerId');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const birthDateInput = document.getElementById('birthDate');

const submitBtn = document.getElementById('submitBtn');
const updateBtn = document.getElementById('updateBtn');
const deleteBtn = document.getElementById('deleteBtn');
const cancelBtn = document.getElementById('cancelBtn');

// State management
let selectedCustomerId = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadCustomers();
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    customerForm.addEventListener('submit', handleAddCustomer);
    updateBtn.addEventListener('click', handleUpdateCustomer);
    deleteBtn.addEventListener('click', handleDeleteCustomer);
    cancelBtn.addEventListener('click', resetForm);
}

// Load all customers
async function loadCustomers() {
    const container = document.getElementById("customer-list");

    try {
        const res = await fetch("/api/persons");

        if (!res.ok) {
            throw new Error("Failed to fetch data");
        }

        const data = await res.json();

        // Clear placeholder
        container.innerHTML = "";

        if (data.length === 0) {
            container.innerHTML = "<p>No customers found.</p>";
            return;
        }

        // Create clickable customer cards
        data.forEach(person => {
            const div = document.createElement("div");
            div.className = "customer-card";
            
            // Add selected class if this is the currently selected customer
            if (selectedCustomerId && person.id === selectedCustomerId) {
                div.classList.add("selected");
            }

            div.innerHTML = `
                <strong>${escapeHtml(person.first_name)} ${escapeHtml(person.last_name)}</strong><br>
                Email: ${escapeHtml(person.email)}<br>
                Phone: ${escapeHtml(person.phone || "-")}
            `;

            div.addEventListener("click", () => {
                selectCustomer(person);
            });

            container.appendChild(div);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = "<p style='color:red;'>Error loading data</p>";
    }
}

// Select a customer and populate the form
function selectCustomer(person) {
    selectedCustomerId = person.id;
    
    // Populate form fields
    customerIdInput.value = person.id;
    firstNameInput.value = person.first_name || '';
    lastNameInput.value = person.last_name || '';
    emailInput.value = person.email || '';
    phoneInput.value = person.phone || '';
    birthDateInput.value = person.birth_date ? formatDate(person.birth_date) : '';
    
    // Update UI for edit mode
    setEditMode(true);
    
    // Refresh the list to show selection highlight
    loadCustomers();
}

// Handle adding a new customer
async function handleAddCustomer(event) {
    event.preventDefault();
    
    const customerData = getFormData();
    
    if (!validateForm(customerData)) {
        return;
    }
    
    try {
        const response = await fetch("/api/persons", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(customerData)
        });
        
        if (!response.ok) {
            throw new Error("Failed to add customer");
        }
        
        await loadCustomers();
        resetForm();
        showNotification("Customer added successfully!", "success");
        
    } catch (error) {
        console.error("Error adding customer:", error);
        showNotification("Failed to add customer. Please try again.", "error");
    }
}

// Handle updating a customer
async function handleUpdateCustomer() {
    if (!selectedCustomerId) {
        return;
    }
    
    const customerData = getFormData();
    
    if (!validateForm(customerData)) {
        return;
    }
    
    if (!confirm("Are you sure you want to update this customer?")) {
        return;
    }
    
    try {
        const response = await fetch(`/api/persons/${selectedCustomerId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(customerData)
        });
        
        if (!response.ok) {
            throw new Error("Failed to update customer");
        }
        
        await loadCustomers();
        resetForm();
        showNotification("Customer updated successfully!", "success");
        
    } catch (error) {
        console.error("Error updating customer:", error);
        showNotification("Failed to update customer. Please try again.", "error");
    }
}

// Handle deleting a customer
async function handleDeleteCustomer() {
    if (!selectedCustomerId) {
        return;
    }
    
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
        return;
    }
    
    try {
        const response = await fetch(`/api/persons/${selectedCustomerId}`, {
            method: "DELETE"
        });
        
        if (!response.ok) {
            throw new Error("Failed to delete customer");
        }
        
        await loadCustomers();
        resetForm();
        showNotification("Customer deleted successfully!", "success");
        
    } catch (error) {
        console.error("Error deleting customer:", error);
        showNotification("Failed to delete customer. Please try again.", "error");
    }
}

// Get form data as an object
function getFormData() {
    return {
        first_name: firstNameInput.value.trim(),
        last_name: lastNameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        birth_date: birthDateInput.value || null
    };
}

// Validate the form
function validateForm(data) {
    if (!data.first_name) {
        showNotification("First name is required", "error");
        return false;
    }
    
    if (!data.last_name) {
        showNotification("Last name is required", "error");
        return false;
    }
    
    if (!data.email) {
        showNotification("Email is required", "error");
        return false;
    }
    
    if (!isValidEmail(data.email)) {
        showNotification("Please enter a valid email address", "error");
        return false;
    }
    
    return true;
}

// Set edit mode (show/hide buttons)
function setEditMode(isEditing) {
    if (isEditing) {
        submitBtn.style.display = "none";
        updateBtn.style.display = "inline-block";
        deleteBtn.style.display = "inline-block";
        cancelBtn.style.display = "inline-block";
    } else {
        submitBtn.style.display = "inline-block";
        updateBtn.style.display = "none";
        deleteBtn.style.display = "none";
        cancelBtn.style.display = "none";
    }
}

// Reset the form to add mode
function resetForm() {
    customerForm.reset();
    customerIdInput.value = "";
    selectedCustomerId = null;
    setEditMode(false);
    loadCustomers(); // Refresh to remove selection highlight
}

// Utility Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
}

function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Show notification messages
function showNotification(message, type) {
    // Remove any existing notifications
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
} 