def translate_text(text, source_lang, target_lang, llm):
    """
    Translate text from source language to target language.
    
    Args:
        text: Text to translate
        source_lang: Source language
        target_lang: Target language
        llm: Language model to use for translation
        
    Returns:
        Translated text
    """
    if source_lang == target_lang:
        return text

    translation_prompt = f"""
    You are a professional legal translator with expertise in accurately translating legal documents while preserving their precise meaning and intent.

    Task:
    Translate the following text from {source_lang} to {target_lang}, ensuring that the legal terminology, nuances, and context remain intact. The translation must be legally accurate and convey the original intent without any misinterpretation or ambiguity.

    Guidelines:
    - Legal Precision: Maintain the original legal meaning, terminology, and structure. Avoid altering or omitting any critical legal details.
    - Clarity & Readability: Ensure the translation is clear, concise, and easy to understand while preserving formal legal language.
    - Structured Formatting: Use short paragraphs, bullet points, and proper spacing to enhance readability.
    - No Additional Content: Provide only the translated text without any introductory phrases, explanations, or extra notes.

    Output Format:
    - Strictly translated legal text without any personal interpretation.
    - Well-organized and properly formatted text to ensure readability and professional presentation.

    {text}
    """
    
    response = llm.invoke(translation_prompt)
    return response.content