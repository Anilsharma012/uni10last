import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, CheckCircle2 } from 'lucide-react';

interface Address {
  _id?: string;
  name: string;
  phone: string;
  houseNumber: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
}

interface AddressSelectorProps {
  onAddressSelected: (address: Address) => void;
  onAddressCreated?: () => void;
}

export const AddressSelector = ({ onAddressSelected, onAddressCreated }: AddressSelectorProps) => {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Address>({
    name: '',
    phone: '',
    houseNumber: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const { ok, json } = await api('/api/auth/addresses');
      if (ok && Array.isArray(json?.data)) {
        setAddresses(json.data);
        const defaultAddr = json.data.find((a: Address) => a.isDefault);
        if (defaultAddr?._id) {
          setSelectedAddressId(defaultAddr._id);
          onAddressSelected(defaultAddr);
        }
      }
    } catch (e) {
      console.error('Failed to fetch addresses:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!formData.name || !formData.phone || !formData.houseNumber || !formData.area || !formData.city || !formData.state || !formData.pincode) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const { ok, json } = await api('/api/auth/addresses', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (ok && Array.isArray(json?.data)) {
        setAddresses(json.data);
        setShowForm(false);
        setFormData({
          name: '',
          phone: '',
          houseNumber: '',
          area: '',
          city: '',
          state: '',
          pincode: '',
          landmark: '',
        });
        toast({
          title: 'Address Added',
          description: 'Your address has been saved successfully',
        });
        if (onAddressCreated) {
          onAddressCreated();
        }
      }
    } catch (e) {
      console.error('Failed to add address:', e);
      toast({
        title: 'Error',
        description: 'Failed to add address',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      const { ok, json } = await api(`/api/auth/addresses/${id}`, {
        method: 'DELETE',
      });

      if (ok && Array.isArray(json?.data)) {
        setAddresses(json.data);
        if (selectedAddressId === id) {
          setSelectedAddressId(null);
        }
        toast({
          title: 'Address Deleted',
          description: 'Your address has been removed',
        });
      }
    } catch (e) {
      console.error('Failed to delete address:', e);
      toast({
        title: 'Error',
        description: 'Failed to delete address',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array(2).fill(null).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.length > 0 && (
        <div className="space-y-3">
          {addresses.map((address) => (
            <Card
              key={address._id}
              className={`p-4 cursor-pointer transition-all ${
                selectedAddressId === address._id
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary'
              }`}
              onClick={() => {
                setSelectedAddressId(address._id || '');
                onAddressSelected(address);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold">{address.name}</p>
                    {selectedAddressId === address._id && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {address.houseNumber}, {address.area}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.city}, {address.state} {address.pincode}
                  </p>
                  {address.landmark && (
                    <p className="text-sm text-muted-foreground">
                      Near: {address.landmark}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {address.phone}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAddress(address._id || '');
                  }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm ? (
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold">Add New Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name" className="text-xs sm:text-sm">Name</Label>
              <Input
                id="name"
                placeholder="Full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-xs sm:text-sm">Phone</Label>
              <Input
                id="phone"
                placeholder="Mobile number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label htmlFor="houseNumber" className="text-xs sm:text-sm">House No.</Label>
              <Input
                id="houseNumber"
                placeholder="House number"
                value={formData.houseNumber}
                onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                className="text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label htmlFor="area" className="text-xs sm:text-sm">Area</Label>
              <Input
                id="area"
                placeholder="Area/Street"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label htmlFor="city" className="text-xs sm:text-sm">City</Label>
              <Input
                id="city"
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label htmlFor="state" className="text-xs sm:text-sm">State</Label>
              <Input
                id="state"
                placeholder="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label htmlFor="pincode" className="text-xs sm:text-sm">Pincode</Label>
              <Input
                id="pincode"
                placeholder="Pincode"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label htmlFor="landmark" className="text-xs sm:text-sm">Landmark (Optional)</Label>
              <Input
                id="landmark"
                placeholder="Landmark"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                className="text-xs sm:text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddAddress}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Address'}
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Address
        </Button>
      )}
    </div>
  );
};
