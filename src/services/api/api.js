const API_BASE_URL = ''; 

export async function fetchPPEChecklist() {
  const res = await fetch(`${API_BASE_URL}/ppe-checklist`);
  if (!res.ok) {
    throw new Error('Failed to fetch PPE checklist');
  }
  const data = await res.json();
  return data;
}
