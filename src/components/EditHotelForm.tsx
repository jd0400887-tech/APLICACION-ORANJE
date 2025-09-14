import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Autocomplete,
  CircularProgress,
  Box
} from '@mui/material';
import { Hotel } from '../data/database';
import throttle from 'lodash/throttle';

interface EditHotelFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (hotel: Hotel) => void;
  hotel: Hotel | null;
}

interface PlaceSuggestion {
  place_id: string;
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

const EditHotelForm: React.FC<EditHotelFormProps> = ({ open, onClose, onSave, hotel }) => {
  const [formData, setFormData] = useState<Hotel | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<readonly PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(hotel);
    if (hotel) {
      setInputValue([hotel.address, hotel.city].filter(Boolean).join(', '));
    }
  }, [hotel]);

  const fetchSuggestions = useMemo(
    () =>
      throttle((input: string, callback: (results: PlaceSuggestion[]) => void) => {
        (async () => {
          if (input.length < 3) {
            callback([]);
            return;
          }
          setLoading(true);
          const response = await fetch(`/api/search?q=${encodeURIComponent(input)}&format=json&addressdetails=1`);
          const data = await response.json();
          callback(data || []);
          setLoading(false);
        })();
      }, 400),
    [],
  );

  useEffect(() => {
    let active = true;

    if (inputValue === '') {
      setOptions([]);
      return undefined;
    }

    fetchSuggestions(inputValue, (results) => {
      if (active) {
        setOptions(results);
      }
    });

    return () => {
      active = false;
    };
  }, [inputValue, fetchSuggestions]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (formData) {
      setFormData({
        ...formData,
        [event.target.name]: event.target.value,
      });
    }
  };

  const handleSave = () => {
    if (formData) {
      onSave(formData);
    }
  };

  if (!formData) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Hotel</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          name="name"
          label="Hotel Name"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.name}
          onChange={handleChange}
        />
        <Autocomplete
          id="address-autocomplete"
          sx={{ mt: 1, mb: 1 }}
          getOptionLabel={(option) => typeof option === 'string' ? option : option.display_name}
          filterOptions={(x) => x}
          options={options}
          autoComplete
          includeInputInList
          filterSelectedOptions
          value={inputValue}
          noOptionsText="No locations found"
          loading={loading}
          onChange={(event: any, newValue: PlaceSuggestion | string | null) => {
            setOptions([]);
            if (typeof newValue === 'object' && newValue !== null) {
              const street = newValue.address.road || '';
              const number = newValue.address.house_number || '';
              const city = newValue.address.city || newValue.address.town || newValue.address.village || '';
              setFormData({
                ...formData,
                address: `${street} ${number}`.trim(),
                city: city,
              });
              setInputValue(newValue.display_name);
            }
          }}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Address"
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        <TextField
          margin="dense"
          name="city"
          label="City"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.city}
          onChange={handleChange}
          // This field is now mainly for display, as it's set by the autocomplete
        />
        <TextField
          margin="dense"
          name="generalManager"
          label="General Manager"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.generalManager}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="contact"
          label="Contact"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.contact}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="email"
          label="Email"
          type="email"
          fullWidth
          variant="outlined"
          value={formData.email}
          onChange={handleChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditHotelForm;
