
import frappe

def inspect_appointment():
    try:
        meta = frappe.get_meta("Healthcare Practitioner")
        print("Healthcare Practitioner Fields:")
        for f in meta.fields:
            if f.fieldname == 'practitioner':
                print(f"  {f.fieldname} ({f.fieldtype}) Options: {f.options}")
            if f.fieldname == 'appointment_for':
                print(f"  {f.fieldname} ({f.fieldtype}) Options: {f.options}")
            if f.reqd:
                print(f"  {f.fieldname} ({f.fieldtype}) - Mandatory")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    frappe.connect("cd.local")
    inspect_appointment()
