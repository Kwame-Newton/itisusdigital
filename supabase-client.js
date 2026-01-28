// Initialize Supabase Client
const supabaseUrl = 'https://eifjacyxswkioqmqtudv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZmphY3l4c3draW9xbXF0dWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NjAyMDEsImV4cCI6MjA4NTEzNjIwMX0.QsjwFSMCtYkt3AJA2BJHdpIiaONxZjTPMAfSa8BsgoY';

// Access the library from the window object to avoid context issues
// and overwrite it with the initialized client instance for global usage
if (window.supabase && window.supabase.createClient) {
    window.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
} else {
    console.error('Supabase library not loaded from CDN');
}
