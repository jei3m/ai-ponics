import React from 'react'
import { Card, Input, DatePicker, Button, Typography, Select } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLeaf } from '@fortawesome/free-solid-svg-icons'
import { StatusMessage } from '../../../services/sensorService'
import dayjs from 'dayjs'
import "./css/PlantInfo.css";

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
        <div className='info-card-title'>
            <FontAwesomeIcon icon={faLeaf} style={{ marginRight: 10 }} />
            Plant Information
        </div>
        }
        bordered={false}
        className='info-card'
    >
        {status && (
        <StatusMessage message={status.message} className={status.className} style={status.style} />
        )}
        {!status && (
        <div>
            <div className='info-card-content'>
                <Select
                    id="plantName"
                    name="plantName"
                    value={plantName}
                    onChange={handlePlantNameChange}
                    placeholder="Select plant"
                    className='info-card-input'
                >
                    <Select.Option value="Lettuce">Lettuce</Select.Option>
                    <Select.Option value="Basil">Basil</Select.Option>
                    <Select.Option value="Spinach">Spinach</Select.Option>
                    <Select.Option value="Tomatoes">Tomatoes</Select.Option>
                    <Select.Option value="Strawberries">Strawberries</Select.Option>
                </Select>
                <DatePicker
                    {...datePickerConfig}
                    id="plantingDate"
                    name="plantingDate"
                    onFocus={e => e.target.blur()}
                    value={plantingDate ? dayjs(plantingDate, 'DD/MM/YYYY') : null}
                />
            </div>
            <div className='days-planted-container'>

                {plantingDate && (
                <Typography.Text strong className='days-planted-text'>
                    Days planted: {daysSincePlanting}
                </Typography.Text>
                )}

                {isPlantInfoChanged && (
                    <Button
                    type="primary"
                    className='info-card-save-button'
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