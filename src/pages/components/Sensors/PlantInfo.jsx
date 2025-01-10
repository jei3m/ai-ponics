import React from 'react'
import { Card, Input, DatePicker, Button, Typography } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLeaf } from '@fortawesome/free-solid-svg-icons'
import { StatusMessage } from '../../../services/sensorService'
import dayjs from 'dayjs'

function PlantInfo({
    status,
    plantName,
    handlePlantNameChange,
    datePickerConfig,
    plantingDate,
    daysSincePlanting,
    isPlantInfoChanged,
    handleSaveChanges
}) {
  return (
    <Card
        title={
        <div style={{ fontSize: '16px' }}>
            <FontAwesomeIcon icon={faLeaf} style={{ marginRight: 10 }} />
            Plant Information
        </div>
        }
        bordered={false}
        style={{
        width: '100%',
        height: 230,              
        background: 'white',
        border: '1px solid #ddd',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        marginBottom: '10px'
        }}
    >
        {status && (
        <StatusMessage message={status.message} className={status.className} style={status.style} />
        )}
        {!status && (
        <div>
            <div style={{ width: '100%' }}>
            <Input
                type="text"
                id="plantName"
                name="plantName"
                value={plantName}
                onChange={handlePlantNameChange}
                placeholder="Enter plant name"
                style={{ width: '100%', marginBottom: 16 }}
            />
            <DatePicker
                {...datePickerConfig}
                id="plantingDate"
                name="plantingDate"
                onFocus={e => e.target.blur()}
                value={plantingDate ? dayjs(plantingDate, 'DD/MM/YYYY') : null}
            />
            </div>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ textAlign: 'left' }}>
                {plantingDate && (
                <Typography.Text strong style={{ fontWeight: 540, fontFamily: 'Inter, sans-serif', marginTop: '12px', textAlign: 'left', marginLeft:'1px' }}>
                    Days planted: {daysSincePlanting}
                </Typography.Text>
                )}
            </div>
            {isPlantInfoChanged && (
                <Button
                type="primary"
                style={{ fontSize: '14px', marginBottom: '-18px', marginTop:'10px'}}
                onClick={handleSaveChanges}
                >
                Save
                </Button>
            )}
            </div>

        </div>
        )}
    </Card>
  )
}

export default PlantInfo;