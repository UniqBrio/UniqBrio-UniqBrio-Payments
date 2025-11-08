/**
 * Date formatting utilities for the payments system
 */

/**
 * Formats a date string to dd-mmm-yyyy format
 * Handles various input formats including ISO strings like "2025-02-05T00:00:00.000+00:00"
 * @param dateInput - Date string, Date object, or null
 * @returns Formatted date string in dd-mmm-yyyy format (e.g., 13-Nov-2025) or "-" if invalid
 */
export function formatDateToDisplay(dateInput: string | Date | null | undefined): string {
  if (!dateInput || dateInput === 'N/A') {
    return "-";
  }
  
  try {
    let date: Date;
    
    // Handle different input types
    if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      return "-";
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "-";
    }
    
    // Format to dd-mmm-yyyy with month abbreviation
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('formatDateToDisplay: Date formatting error:', error, 'Input:', dateInput);
    return "-";
  }
}

/**
 * Formats a date string to a more readable format (e.g., "Feb 5, 2025")
 * @param dateInput - Date string, Date object, or null
 * @returns Formatted date string or "-" if invalid
 */
export function formatDateToReadable(dateInput: string | Date | null | undefined): string {
  if (!dateInput || dateInput === 'N/A') return "-";
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    if (isNaN(date.getTime())) return "-";
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return "-";
  }
}

/**
 * Parses courseStartDate from students collection and ensures proper format
 * @param courseStartDate - Raw courseStartDate from students collection
 * @returns Formatted date string for display
 */
export function formatCourseStartDate(courseStartDate: string | Date | null | undefined): string {
  return formatDateToDisplay(courseStartDate);
}