import { getPlantData } from '../services/sensorService';
export const getSystemKnowledge = (plantName, weatherData) => {
  const plantData = getPlantData(plantName);

  let plantSpecificKnowledge = '';
  const temperature = weatherData?.main?.temp || 'N/A';
  if (plantData) {
    try {
      // Build the plant-specific knowledge string
      plantSpecificKnowledge = `
        Plant-Specific Knowledge for ${plantName}:
        - Temperature Range: ${plantData.MIN_TEMPERATURE || 'N/A'}°C to ${plantData.MAX_TEMPERATURE || 'N/A'}°C
        - Humidity Range: ${plantData.MIN_HUMIDITY || 'N/A'}% to ${plantData.MAX_HUMIDITY || 'N/A'}%
        - pH Range: ${plantData.MIN_PH_LEVEL || 'N/A'} to ${plantData.MAX_PH_LEVEL || 'N/A'}

        Critical Alerts:
        ${temperature < plantData.MIN_TEMPERATURE ? `- ❄️ LOW TEMP ALERT: Below minimum (${plantData.MIN_TEMPERATURE}°C)` : ''}
        ${temperature > plantData.MAX_TEMPERATURE ? `- 🔥 HIGH TEMP ALERT: Above maximum (${plantData.MAX_TEMPERATURE}°C)` : ''}
        
        ${plantData.DISEASES ? `- Common Diseases:
          ${Object.entries(plantData.DISEASES)
            .map(([disease, details]) => `
            * ${disease}:
              - Symptoms: ${details.Symptoms || 'N/A'}
              - Prevention: ${details.Prevention || 'N/A'}
              - Cure: ${details.Cure || 'N/A'}
            `)
            .join('')}` : ''}
        
        ${plantData.RECOMMENDED_VARIETIES ? `- Recommended Varieties:
          * Types: 
            ${plantData.RECOMMENDED_VARIETIES.types?.map(type => `- ${type}`).join('\n            ') || 'N/A'}
          * Why Recommended: ${plantData.RECOMMENDED_VARIETIES.why || 'N/A'}
          * Pro Tip: ${plantData.RECOMMENDED_VARIETIES.proTip || 'N/A'}
        ` : ''}
        
        ${plantData.ENVIRONMENTAL_TIPS ? `- Environmental Tips:
          * Pest Control:
            ${plantData.ENVIRONMENTAL_TIPS.pestControl?.map(tip => `- ${tip}`).join('\n            ') || 'N/A'}
          * Heat Solutions:
            ${plantData.ENVIRONMENTAL_TIPS.heatSolutions?.map(tip => `- ${tip}`).join('\n            ') || 'N/A'}
          * Rainy Season:
            ${plantData.ENVIRONMENTAL_TIPS.rainySeason?.map(tip => `- ${tip}`).join('\n            ') || 'N/A'}
        ` : ''}
        
        ${plantData.BEST_SEASONS ? `- Best Seasons:
          * Plant: ${plantData.BEST_SEASONS.plant || 'N/A'}
          * Avoid: ${plantData.BEST_SEASONS.avoid || 'N/A'}
          * Tips: ${plantData.BEST_SEASONS.tips || 'N/A'}
        ` : ''}
        
        ${plantData.CARE_INSTRUCTIONS ? `- Care Instructions:
          * Planting:
            ${plantData.CARE_INSTRUCTIONS.planting?.map(step => `- ${step}`).join('\n            ') || 'N/A'}
          * Growing:
            ${plantData.CARE_INSTRUCTIONS.growing?.map(step => `- ${step}`).join('\n            ') || 'N/A'}
        ` : ''}
        
        ${plantData.NOTES ? `- Notes:
          ${plantData.NOTES.map((note) => `* ${note}`).join('\n          ')}` : ''}

        ${plantData.LIFE_CYCLE ? `- Life Cycle:
          ${Object.entries(plantData.LIFE_CYCLE)
            .map(([stage, detail]) => `* ${stage}: ${detail}`)
            .join('\n          ')}` : ''}
      `;
      console.log(plantSpecificKnowledge)
    } catch (error) {
      console.error('Error processing plant data:', error);
      plantSpecificKnowledge = 'Error processing plant-specific data.';
    }
  }

  return `
    When responding to queries, prioritize information from this custom knowledge base. 
    If the requested information is not found in the custom knowledge base, rely on pre-trained data to generate a response. 
    
    User Customization Flags:
    - Detect phrases like "my custom system" to trigger non-standard recommendations

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
