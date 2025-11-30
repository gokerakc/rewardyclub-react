'use client';

import { useState, useRef } from 'react';
import { Business } from '@/types';
import { updateBusiness } from '@/lib/firestore';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { X, Upload, Save, Building2, Award, Hash, Loader2, Crown } from 'lucide-react';
import { canUploadLogo, getStampConfigLimits } from '@/lib/subscription';

interface BusinessSettingsProps {
  business: Business;
  onClose: () => void;
  onUpdate: () => void;
  onUpgrade?: () => void;
}

export default function BusinessSettings({
  business,
  onClose,
  onUpdate,
  onUpgrade,
}: BusinessSettingsProps) {
  const [name, setName] = useState(business.name);
  const [totalStamps, setTotalStamps] = useState(business.stampCardConfig.totalStamps);
  const [reward, setReward] = useState(business.stampCardConfig.reward);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(business.logoURL || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    setLogoFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return logoPreview;

    try {
      // Delete old logo if exists
      if (business.logoURL) {
        try {
          const oldLogoRef = ref(storage, business.logoURL);
          await deleteObject(oldLogoRef);
        } catch (error) {
          // Ignore errors when deleting old logo
          console.warn('Could not delete old logo:', error);
        }
      }

      // Upload new logo
      const timestamp = Date.now();
      const fileName = `logos/${business.id}_${timestamp}.${logoFile.name.split('.').pop()}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, logoFile);
      const downloadURL = await getDownloadURL(storageRef);

      return downloadURL;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw new Error('Failed to upload logo');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate inputs
      if (!name.trim()) {
        throw new Error('Business name is required');
      }

      const stampLimits = getStampConfigLimits(business);
      if (totalStamps < stampLimits.min || totalStamps > stampLimits.max) {
        throw new Error(`Number of stamps must be between ${stampLimits.min} and ${stampLimits.max}`);
      }

      if (!reward.trim()) {
        throw new Error('Reward description is required');
      }

      // Upload logo if changed
      const logoURL = await uploadLogo();

      // Update business
      const updates: Partial<Business> = {
        name,
        stampCardConfig: {
          ...business.stampCardConfig,
          totalStamps,
          reward,
        },
      };

      if (logoURL) {
        updates.logoURL = logoURL;
      }

      await updateBusiness(business.id, updates);

      // Notify parent component to refetch data
      await onUpdate();

      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-2">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Business Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={saving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              Business Logo
              {!canUploadLogo(business) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <Crown className="w-3 h-3" />
                  Pro
                </span>
              )}
            </label>
            {canUploadLogo(business) ? (
              <div className="flex items-center gap-4">
                {/* Logo Preview */}
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-10 h-10 text-gray-400" />
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
                    disabled={saving}
                  >
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG or GIF (max. 2MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800 mb-3">
                  Logo uploads are available in the Pro plan. Upgrade to add your custom business logo.
                </p>
                {onUpgrade && (
                  <button
                    onClick={onUpgrade}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade to Pro
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900"
              placeholder="Enter business name"
              disabled={saving}
            />
          </div>

          {/* Stamp Card Configuration */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-600" />
              Stamp Card Configuration
            </h3>

            <div className="space-y-4">
              {/* Number of Stamps */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Number of Stamps Required
                  {business.subscription.tier === 'free' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                      <Crown className="w-3 h-3" />
                      Pro
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    min={getStampConfigLimits(business).min}
                    max={getStampConfigLimits(business).max}
                    value={totalStamps}
                    onChange={(e) => setTotalStamps(parseInt(e.target.value) || getStampConfigLimits(business).min)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900"
                    disabled={saving || business.subscription.tier === 'free'}
                  />
                </div>
                {business.subscription.tier === 'free' ? (
                  <p className="text-xs text-orange-600 mt-1">
                    Free plan is fixed at 10 stamps. Upgrade to Pro to customize between 3-50 stamps.
                    {onUpgrade && (
                      <button
                        onClick={onUpgrade}
                        className="ml-1 underline hover:text-orange-700"
                      >
                        Upgrade now
                      </button>
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Choose between 3 and 50 stamps
                  </p>
                )}
              </div>

              {/* Reward */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reward Description
                </label>
                <input
                  type="text"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900"
                  placeholder="e.g., Free Coffee, 20% Off, Free Dessert"
                  disabled={saving}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be shown on customer stamp cards
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Changes to stamp card settings will only apply to new cards.
              Existing customer cards will keep their current configuration.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
