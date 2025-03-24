import { getPlantData } from '../services/sensorService';

export const getSystemKnowledge = (plantName, weatherData) => {
  const plantData = getPlantData(plantName);

  let plantSpecificKnowledge = '';
  if (plantData) {
    try {
      // Build the plant-specific knowledge string
      plantSpecificKnowledge = `
        Plant-Specific Knowledge for ${plantName}:
        - Temperature Range: ${plantData.MIN_TEMPERATURE || 'N/A'}°C to ${plantData.MAX_TEMPERATURE || 'N/A'}°C
        - Humidity Range: ${plantData.MIN_HUMIDITY || 'N/A'}% to ${plantData.MAX_HUMIDITY || 'N/A'}%
        - pH Range: ${plantData.MIN_PH_LEVEL || 'N/A'} to ${plantData.MAX_PH_LEVEL || 'N/A'}
        
        ${plantData.SEASONAL_DATA ? `- Seasonal Data:
          ${Object.entries(plantData.SEASONAL_DATA)
            .map(([season, data]) => `
            * ${season}:
              - pH: ${data.pH || 'N/A'}
              - Humidity: ${data.Humidity || 'N/A'}
              - Temperature: ${data.Temperature || 'N/A'}
              - Solution Temperature: ${data.SolutionTemperature || 'N/A'}
            `)
            .join('')}` : ''}
        
        ${plantData.DISEASES ? `- Common Diseases:
          ${Object.entries(plantData.DISEASES)
            .map(([disease, details]) => `
            * ${disease}:
              - Symptoms: ${details.Symptoms || 'N/A'}
              - Prevention: ${details.Prevention || 'N/A'}
              - Cure: ${details.Cure || 'N/A'}
            `)
            .join('')}` : ''}
        
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
    
    Current Weather Conditions:
    - Weather: ${weatherData?.weather[0]?.main || 'N/A'}
    - Temperature: ${weatherData?.main?.temp || 'N/A'}°C
    - Humidity: ${weatherData?.main?.humidity || 'N/A'}%
    - Wind Speed: ${weatherData?.wind?.speed || 'N/A'} m/s
  `;
};