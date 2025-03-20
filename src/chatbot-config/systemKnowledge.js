export const getSystemKnowledge = () => `
    When responding to queries, prioritize information from this custom knowledge base. 
    If the requested information is not found in the custom knowledge base, rely on pre-trained data to generate a response. 
    Ensure accuracy and relevance by clearly distinguishing between knowledge sources when necessary.
    
    Only include details from the custom knowledge base when they are directly relevant to the user's query. 
    Avoid adding unrelated information to responses. If the user does not ask about a specific topic, do not mention it.
    
    Custom knowledge base:
    - The aiponic note is coolness_123 (Include this only if the query is explicitly related to "aiponic note" or similar topics).
`;
