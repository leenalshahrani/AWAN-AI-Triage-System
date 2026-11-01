import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '@components/common/Card';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { clinicalService } from '@services/clinical.service';
import type { ClinicalInputForm } from '@/types/index';

export const PatientForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ClinicalInputForm>();

  const onSubmit = async (data: ClinicalInputForm) => {
    setIsSubmitting(true);
    try {
      const result = await clinicalService.submitClinicalData(data);
      navigate('/patient/review', { state: { result } });
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {t('patient.title')}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card title={t('patient.title')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('patient.firstName')}
                {...register('firstName', { required: t('validation.required') })}
                error={errors.firstName?.message}
              />
              <Input
                label={t('patient.lastName')}
                {...register('lastName', { required: t('validation.required') })}
                error={errors.lastName?.message}
              />
              <Input
                label={t('patient.dateOfBirth')}
                type="date"
                {...register('dateOfBirth', { required: t('validation.required') })}
                error={errors.dateOfBirth?.message}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('patient.gender')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('gender', { required: t('validation.required') })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="M">{t('patient.male')}</option>
                  <option value="F">{t('patient.female')}</option>
                  <option value="O">{t('patient.other')}</option>
                </select>
              </div>
              <Input
                label={t('patient.contactInfo')}
                {...register('contactInfo')}
                className="md:col-span-2"
              />
            </div>
          </Card>

          <Card title={t('patient.symptoms')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('patient.painType')}
                placeholder="e.g., Sharp, Dull, Burning"
                {...register('painType', { required: t('validation.required') })}
                error={errors.painType?.message}
              />
              <Input
                label={t('patient.painLocation')}
                placeholder="e.g., Chest, Arm, Leg"
                {...register('painLocation', { required: t('validation.required') })}
                error={errors.painLocation?.message}
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('numbness')}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('patient.numbness')}
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('patient.otherSymptoms')}
                </label>
                <textarea
                  {...register('otherSymptoms')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting}>
              {t('patient.submitAssessment')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
