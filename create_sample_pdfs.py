import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

def create_sample_pdfs():
    """Create sample PDF files with legal information for testing."""
    # Ensure the directory exists
    os.makedirs("./LEGAL-DATA", exist_ok=True)
    
    # Create a PDF with Know Your Rights information
    create_know_your_rights_pdf()
    
    # Create a PDF with Criminal Law information
    create_criminal_law_pdf()
    
    # Create a PDF with Property Law information
    create_property_law_pdf()
    
    print("Created 3 sample PDF files in the LEGAL-DATA directory.")

def create_know_your_rights_pdf():
    """Create a PDF with Know Your Rights information."""
    pdf_path = "./LEGAL-DATA/know_your_rights.pdf"
    doc = SimpleDocTemplate(pdf_path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title = Paragraph("<b>Know Your Rights: A Citizen's Guide</b>", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 12))
    
    # Introduction
    intro = Paragraph(
        "This guide provides basic information about your fundamental rights as a citizen. "
        "Understanding your rights is essential for protecting yourself in various situations.",
        styles['Normal']
    )
    story.append(intro)
    story.append(Spacer(1, 12))
    
    # Freedom of Speech
    h1 = Paragraph("<b>Freedom of Speech</b>", styles['Heading2'])
    story.append(h1)
    p1 = Paragraph(
        "You have the right to express your opinions freely without fear of government censorship. "
        "However, this right is not absolute and does not protect speech that incites immediate lawless action, "
        "contains true threats, or constitutes defamation.",
        styles['Normal']
    )
    story.append(p1)
    story.append(Spacer(1, 12))
    
    # Right to Privacy
    h2 = Paragraph("<b>Right to Privacy</b>", styles['Heading2'])
    story.append(h2)
    p2 = Paragraph(
        "You have a right to privacy in certain contexts. This includes privacy in your home, "
        "personal communications, and certain personal information. Law enforcement generally needs "
        "a warrant to search your home or access your private communications.",
        styles['Normal']
    )
    story.append(p2)
    story.append(Spacer(1, 12))
    
    # Right to Legal Representation
    h3 = Paragraph("<b>Right to Legal Representation</b>", styles['Heading2'])
    story.append(h3)
    p3 = Paragraph(
        "If you are arrested or questioned by police while in custody, you have the right to an attorney. "
        "If you cannot afford an attorney, one will be provided for you. You should clearly state that you "
        "wish to speak with an attorney if questioned by law enforcement.",
        styles['Normal']
    )
    story.append(p3)
    story.append(Spacer(1, 12))
    
    # Employment Rights
    h4 = Paragraph("<b>Employment Rights</b>", styles['Heading2'])
    story.append(h4)
    p4 = Paragraph(
        "You have the right to work in an environment free from discrimination based on race, color, "
        "religion, sex, national origin, age, disability, or genetic information. You also have the right "
        "to fair wages and safe working conditions.",
        styles['Normal']
    )
    story.append(p4)
    
    # Build the PDF
    doc.build(story)

def create_criminal_law_pdf():
    """Create a PDF with Criminal Law information."""
    pdf_path = "./LEGAL-DATA/criminal_law.pdf"
    doc = SimpleDocTemplate(pdf_path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title = Paragraph("<b>Understanding Criminal Law</b>", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 12))
    
    # Introduction
    intro = Paragraph(
        "This document provides an overview of basic criminal law concepts and procedures. "
        "It is intended as general information and not as legal advice for specific situations.",
        styles['Normal']
    )
    story.append(intro)
    story.append(Spacer(1, 12))
    
    # Types of Crimes
    h1 = Paragraph("<b>Types of Crimes</b>", styles['Heading2'])
    story.append(h1)
    p1 = Paragraph(
        "Crimes are typically classified as either misdemeanors or felonies. Misdemeanors are less serious "
        "offenses that typically carry penalties of less than one year in jail. Felonies are more serious "
        "crimes that can result in imprisonment for more than one year.",
        styles['Normal']
    )
    story.append(p1)
    story.append(Spacer(1, 12))
    
    # Criminal Procedure
    h2 = Paragraph("<b>Criminal Procedure</b>", styles['Heading2'])
    story.append(h2)
    p2 = Paragraph(
        "The criminal justice process typically includes investigation, arrest, charging, arraignment, "
        "discovery, plea bargaining, trial, and sentencing. At each stage, defendants have specific rights "
        "that must be respected by law enforcement and the courts.",
        styles['Normal']
    )
    story.append(p2)
    story.append(Spacer(1, 12))
    
    # Rights of the Accused
    h3 = Paragraph("<b>Rights of the Accused</b>", styles['Heading2'])
    story.append(h3)
    p3 = Paragraph(
        "Individuals accused of crimes have several constitutional rights, including the right to remain silent, "
        "the right to an attorney, the right to a fair and speedy trial, the right to confront witnesses, "
        "and the right to be free from unreasonable searches and seizures.",
        styles['Normal']
    )
    story.append(p3)
    
    # Build the PDF
    doc.build(story)

def create_property_law_pdf():
    """Create a PDF with Property Law information."""
    pdf_path = "./LEGAL-DATA/property_law.pdf"
    doc = SimpleDocTemplate(pdf_path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title = Paragraph("<b>Property Law: Key Concepts</b>", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 12))
    
    # Introduction
    intro = Paragraph(
        "This guide covers fundamental concepts in property law. Understanding these principles "
        "can help you navigate property transactions and disputes.",
        styles['Normal']
    )
    story.append(intro)
    story.append(Spacer(1, 12))
    
    # Types of Property
    h1 = Paragraph("<b>Types of Property</b>", styles['Heading2'])
    story.append(h1)
    p1 = Paragraph(
        "Property is generally classified as either real property (land and anything permanently attached to it) "
        "or personal property (movable items). Different legal rules apply to each type of property.",
        styles['Normal']
    )
    story.append(p1)
    story.append(Spacer(1, 12))
    
    # Property Ownership
    h2 = Paragraph("<b>Property Ownership</b>", styles['Heading2'])
    story.append(h2)
    p2 = Paragraph(
        "Property can be owned in various ways, including sole ownership, joint tenancy, tenancy in common, "
        "and tenancy by the entirety. Each form of ownership has different implications for property rights, "
        "transfer of ownership upon death, and liability.",
        styles['Normal']
    )
    story.append(p2)
    story.append(Spacer(1, 12))
    
    # Landlord-Tenant Law
    h3 = Paragraph("<b>Landlord-Tenant Law</b>", styles['Heading2'])
    story.append(h3)
    p3 = Paragraph(
        "Landlord-tenant law governs the rental of commercial and residential property. It covers issues such as "
        "the rights and responsibilities of landlords and tenants, lease agreements, security deposits, "
        "evictions, and habitability requirements.",
        styles['Normal']
    )
    story.append(p3)
    story.append(Spacer(1, 12))
    
    # Property Disputes
    h4 = Paragraph("<b>Property Disputes</b>", styles['Heading2'])
    story.append(h4)
    p4 = Paragraph(
        "Common property disputes include boundary disputes, easement disputes, adverse possession claims, "
        "and nuisance claims. These disputes can often be resolved through negotiation, mediation, "
        "or litigation if necessary.",
        styles['Normal']
    )
    story.append(p4)
    
    # Build the PDF
    doc.build(story)

if __name__ == "__main__":
    create_sample_pdfs()