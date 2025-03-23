import { getPlantData } from '../services/sensorService';

export const getSystemKnowledge = (plantName) => {
  const plantData = getPlantData(plantName);

  let plantSpecificKnowledge = '';
  if (plantData) {
    try {
      plantSpecificKnowledge = `
        Plant-Specific Knowledge for ${plantName}:
        - Temperature Range: ${plantData.MIN_TEMPERATURE || 'N/A'}°C to ${plantData.MAX_TEMPERATURE || 'N/A'}°C
        - Humidity Range: ${plantData.MIN_HUMIDITY || 'N/A'}% to ${plantData.MAX_HUMIDITY || 'N/A'}%
        - pH Range: ${plantData.MIN_PH_LEVEL || 'N/A'} to ${plantData.MAX_PH_LEVEL || 'N/A'}
        - Solution Temperature: ${plantData.SOLUTION_TEMP?.MIN || 'N/A'}°C to ${plantData.SOLUTION_TEMP?.MAX || 'N/A'}°C
        ${plantData.DISEASES ? `- Common Diseases and Solutions:
          ${Object.entries(plantData.DISEASES)
            .map(([disease, solution]) => `* ${disease}: ${solution}`)
            .join('\n          ')}` : ''}
        ${plantData.NOTES ? `- Notes:
          ${plantData.NOTES.map((note) => `* ${note}`).join('\n          ')}` : ''}
      `;
    } catch (error) {
      console.error('Error processing plant data:', error);
      plantSpecificKnowledge = 'Error processing plant-specific data.';
    }
  }

  return `
    When responding to queries, prioritize information from this custom knowledge base. 
    If the requested information is not found in the custom knowledge base, rely on pre-trained data to generate a response. 
    Ensure accuracy and relevance by clearly distinguishing between knowledge sources when necessary.
    
    Only include details from the custom knowledge base when they are directly relevant to the user's query. 
    Avoid adding unrelated information to responses. If the user does not ask about a specific topic, do not mention it.
    
    Custom knowledge base:
    ${plantSpecificKnowledge || 'No plant-specific data available.'}
  `;
};