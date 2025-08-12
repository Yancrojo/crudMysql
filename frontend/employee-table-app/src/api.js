export async function fetchEmployees() {
    const response = await fetch('/empleados');
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
}