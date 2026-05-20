import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { getApiErrorMessage } from '../services/api';
import {
  listCampusStructuredOptions,
  type CampusStructuredOption,
} from '../services/studentApi';
import {
  BottomSheet,
  CategoryPill,
  FieldError,
  InlineBanner,
  PrimaryButton,
  SectionCard,
  colors,
  metrics,
} from '../components/InCampusUI';

type ParticipationMode = 'open' | 'approval_based';
type GenderPreference = 'all' | 'male_only' | 'female_only';
type SheetMode = 'category' | 'location' | 'start' | 'end' | null;

type StructuredOptionChoice = CampusStructuredOption;

interface CreatedActivityResponse {
  activityId?: string;
}

interface FormErrors {
  title?: string;
  categoryId?: string;
  meetingPointId?: string;
  scheduledDateTime?: string;
  scheduledEndDateTime?: string;
  maxParticipants?: string;
  maxRequests?: string;
}

const PARTICIPATION_OPTIONS: Array<{ label: string; value: ParticipationMode }> = [
  { label: 'Anyone', value: 'open' },
  { label: 'With my approval', value: 'approval_based' },
];

const PREFERENCE_OPTIONS: Array<{ label: string; value: GenderPreference }> = [
  { label: 'Open to all', value: 'all' },
  { label: 'Male students', value: 'male_only' },
  { label: 'Female students', value: 'female_only' },
];

export const CreateActivityScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [meetingPointId, setMeetingPointId] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(null);
  const [scheduledEndDateTime, setScheduledEndDateTime] = useState<Date | null>(null);
  const [maxParticipants, setMaxParticipants] = useState('');
  const [participationMode, setParticipationMode] = useState<ParticipationMode>('open');
  const [maxRequests, setMaxRequests] = useState('');
  const [genderPreference, setGenderPreference] = useState<GenderPreference>('all');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [creating, setCreating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [categories, setCategories] = useState<StructuredOptionChoice[]>([]);
  const [locations, setLocations] = useState<StructuredOptionChoice[]>([]);
  const [success, setSuccess] = useState(false);
  const formLocked = creating || success || optionsLoading;

  const selectedCategory = categories.find((item) => item.optionId === categoryId);
  const selectedLocation = locations.find((item) => item.optionId === meetingPointId);
  const filteredCategories = useFilteredOptions(categories, searchQuery);
  const filteredLocations = useFilteredOptions(locations, searchQuery);
  const optionsReady = categories.length > 0 && locations.length > 0;

  const loadStructuredOptions = useCallback(async () => {
    setOptionsLoading(true);
    setOptionsError(null);
    try {
      const campusId = await AsyncStorage.getItem('selectedCampusId');
      if (!campusId) {
        setCategories([]);
        setLocations([]);
        setOptionsError('Select a campus before creating an activity.');
        return;
      }

      const [categoryOptions, locationOptions] = await Promise.all([
        listCampusStructuredOptions(campusId, { optionType: 'activity_category' }),
        listCampusStructuredOptions(campusId, { optionType: 'campus_location' }),
      ]);

      setCategories(categoryOptions.filter((option) => option.isActive));
      setLocations(locationOptions.filter((option) => option.isActive));
      setCategoryId((current) =>
        categoryOptions.some((option) => option.optionId === current && option.isActive) ? current : ''
      );
      setMeetingPointId((current) =>
        locationOptions.some((option) => option.optionId === current && option.isActive) ? current : ''
      );
    } catch (error) {
      setCategories([]);
      setLocations([]);
      setOptionsError(getApiErrorMessage(error) ?? 'Could not load campus options.');
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStructuredOptions();
  }, [loadStructuredOptions]);

  const resetSheet = () => {
    setSheetMode(null);
    setSearchQuery('');
  };

  const handlePublish = async () => {
    if (formLocked) {
      return;
    }

    const nextErrors = validateCreateForm({
      title,
      categoryId,
      meetingPointId,
      scheduledDateTime,
      scheduledEndDateTime,
      maxParticipants,
      participationMode,
      maxRequests,
    });

    setErrors(nextErrors);
    setApiError(null);

    if (!optionsReady) {
      setApiError('Choose active campus category and meeting point options before publishing.');
      return;
    }

    if (Object.keys(nextErrors).length > 0) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setCreating(true);
    try {
      const parsedMaxParticipants = Number.parseInt(maxParticipants.trim(), 10);
      const parsedMaxRequests = maxRequests.trim()
        ? Number.parseInt(maxRequests.trim(), 10)
        : undefined;

      const createdActivity = await api.post<CreatedActivityResponse>('/activities', {
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId,
        meetingPointId,
        maxParticipants: parsedMaxParticipants,
        participationMode,
        maxRequests: participationMode === 'approval_based' ? parsedMaxRequests : undefined,
        genderPreference,
        scheduledDateTime: scheduledDateTime!.toISOString(),
        scheduledEndDateTime: scheduledEndDateTime ? scheduledEndDateTime.toISOString() : undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        navigation.navigate('ActivityFeed', {
          refreshAfterCreate: Date.now(),
          createdActivityId: createdActivity.data?.activityId,
        });
      }, 1200);
    } catch (error) {
      setApiError(getApiErrorMessage(error) ?? 'Could not publish activity. Try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <CreateTopBar topInset={insets.top} submitting={formLocked} onCancel={() => navigation.goBack()} />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 112 + Math.max(insets.bottom, 10) },
        ]}
      >
        {success ? (
          <View style={styles.bannerWrap}>
            <InlineBanner tone="success" text="Activity published!" />
          </View>
        ) : null}
        {apiError ? (
          <View style={styles.bannerWrap}>
            <InlineBanner tone="error" text={apiError} />
          </View>
        ) : null}
        {optionsLoading ? (
          <View style={styles.bannerWrap}>
            <InlineBanner tone="warning" text="Loading campus options..." />
          </View>
        ) : null}
        {optionsError ? (
          <View style={styles.bannerWrap}>
            <InlineBanner tone="error" text={optionsError} actionLabel="Retry" onAction={loadStructuredOptions} />
          </View>
        ) : null}
        {!optionsLoading && !optionsError && !optionsReady ? (
          <View style={styles.bannerWrap}>
            <InlineBanner tone="warning" text="Campus options are not ready yet. Ask a campus admin to add active categories and meeting points." />
          </View>
        ) : null}

        <FormSection step="1" title="What and where">
          <FieldShell label="Category" error={errors.categoryId}>
            <SelectorField
              placeholder="What kind of activity?"
              valueNode={selectedCategory ? <CategoryPill label={selectedCategory.name} compact /> : null}
              onPress={() => setSheetMode('category')}
              disabled={formLocked || categories.length === 0}
            />
          </FieldShell>

          <FieldShell label="Title" error={errors.title}>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={title}
              onChangeText={setTitle}
              placeholder="Give your activity a name"
              placeholderTextColor={colors.text3}
              maxLength={100}
              editable={!formLocked}
            />
            {title.length >= 82 ? <Text style={styles.countText}>{title.length}/100</Text> : null}
          </FieldShell>

          <FieldShell label="When" error={errors.scheduledDateTime || errors.scheduledEndDateTime}>
            <SelectorField
              placeholder="Pick a date and time"
              valueNode={scheduledDateTime ? <Text style={styles.selectorValue}>{formatDateTimeLabel(scheduledDateTime)}</Text> : null}
              onPress={() => setSheetMode('start')}
              disabled={formLocked}
            />
            {scheduledDateTime ? (
              <View style={styles.endTimeRow}>
                {scheduledEndDateTime ? (
                  <>
                    <Pressable onPress={() => setSheetMode('end')} disabled={formLocked}>
                      <Text style={styles.endTimeLink}>Ends {formatTime(scheduledEndDateTime)}</Text>
                    </Pressable>
                    <Pressable onPress={() => setScheduledEndDateTime(null)} disabled={formLocked}>
                      <Text style={styles.removeLink}>Remove</Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable onPress={() => setSheetMode('end')} disabled={formLocked}>
                    <Text style={styles.endTimeLink}>Add end time</Text>
                  </Pressable>
                )}
              </View>
            ) : null}
          </FieldShell>

          <FieldShell label="Where" error={errors.meetingPointId}>
            <SelectorField
              placeholder="Pick a meeting spot"
              valueNode={selectedLocation ? <Text style={styles.selectorValue}>{selectedLocation.name}</Text> : null}
              onPress={() => setSheetMode('location')}
              disabled={formLocked || locations.length === 0}
            />
          </FieldShell>

          <FieldShell label="Spots available" helper="Including yourself" error={errors.maxParticipants} last>
            <StepperField
              value={maxParticipants}
              onChange={setMaxParticipants}
              placeholder="How many people?"
              disabled={formLocked}
              error={Boolean(errors.maxParticipants)}
            />
          </FieldShell>
        </FormSection>

        <FormSection step="2" title="Description" sub="optional">
          <FieldShell label="Description" last>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Add details, context, or a short message"
              placeholderTextColor={colors.text3}
              maxLength={300}
              multiline
              textAlignVertical="top"
              editable={!formLocked}
            />
            <Text style={styles.countText}>{description.length}/300</Text>
          </FieldShell>
        </FormSection>

        <FormSection step="3" title="Advanced">
          <View style={styles.advancedInner}>
            <Pressable style={styles.advancedHeader} onPress={() => setAdvancedOpen((value) => !value)} disabled={formLocked}>
              <View>
                <Text style={styles.advancedTitle}>Advanced options</Text>
                <Text style={styles.advancedHelp}>Approval, limits, and participant preference</Text>
              </View>
              <Text style={styles.chevron}>{advancedOpen ? '⌄' : '›'}</Text>
            </Pressable>

            {advancedOpen ? (
              <View style={styles.advancedBody}>
                <Text style={styles.controlLabel}>Who can join</Text>
                <SegmentedControl<ParticipationMode>
                  options={PARTICIPATION_OPTIONS}
                  value={participationMode}
                  onChange={setParticipationMode}
                  disabled={formLocked}
                />

                {participationMode === 'approval_based' ? (
                  <View style={styles.advancedField}>
                    <Text style={styles.controlLabel}>Max pending requests</Text>
                    <TextInput
                      style={[styles.input, errors.maxRequests && styles.inputError]}
                      value={maxRequests}
                      onChangeText={setMaxRequests}
                      placeholder="No limit"
                      placeholderTextColor={colors.text3}
                      keyboardType="numeric"
                      editable={!formLocked}
                    />
                    <Text style={styles.helperText}>Limit how many requests can wait at once</Text>
                    <FieldError message={errors.maxRequests} />
                  </View>
                ) : null}

                <Text style={[styles.controlLabel, styles.preferenceLabel]}>Participant preference</Text>
                <ChipControl<GenderPreference>
                  options={PREFERENCE_OPTIONS}
                  value={genderPreference}
                  onChange={setGenderPreference}
                  disabled={formLocked}
                />
              </View>
            ) : null}
          </View>
        </FormSection>
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <PrimaryButton label="Publish" loading={creating} disabled={formLocked || !optionsReady} onPress={handlePublish} />
      </View>

      <OptionSheet
        visible={sheetMode === 'category'}
        title="Choose category"
        options={filteredCategories}
        query={searchQuery}
        onQuery={setSearchQuery}
        selectedId={categoryId}
        emptyLabel="No options found"
        renderOptionAccessory={(option) => <CategoryPill label={option.name} compact />}
        onSelect={(option) => {
          setCategoryId(option.optionId);
          setErrors((current) => ({ ...current, categoryId: undefined }));
          resetSheet();
        }}
        onClose={resetSheet}
      />

      <OptionSheet
        visible={sheetMode === 'location'}
        title="Choose meeting spot"
        options={filteredLocations}
        query={searchQuery}
        onQuery={setSearchQuery}
        selectedId={meetingPointId}
        emptyLabel="No options found"
        renderOptionAccessory={(option) => (
          <Text style={styles.optionKind}>{option.description ?? 'Meeting point'}</Text>
        )}
        onSelect={(option) => {
          setMeetingPointId(option.optionId);
          setErrors((current) => ({ ...current, meetingPointId: undefined }));
          resetSheet();
        }}
        onClose={resetSheet}
      />

      <DateTimeSheet
        visible={sheetMode === 'start' || sheetMode === 'end'}
        title={sheetMode === 'end' ? 'Pick end time' : 'Pick date and time'}
        initialDate={sheetMode === 'end' ? scheduledEndDateTime ?? scheduledDateTime : scheduledDateTime}
        baseDate={sheetMode === 'end' ? scheduledDateTime : undefined}
        allowClear={sheetMode === 'end'}
        onClear={() => {
          setScheduledEndDateTime(null);
          resetSheet();
        }}
        onConfirm={(value) => {
          if (sheetMode === 'end') {
            setScheduledEndDateTime(value);
            setErrors((current) => ({ ...current, scheduledEndDateTime: undefined }));
          } else {
            setScheduledDateTime(value);
            if (scheduledEndDateTime && scheduledEndDateTime <= value) {
              setScheduledEndDateTime(null);
            }
            setErrors((current) => ({ ...current, scheduledDateTime: undefined }));
          }
          resetSheet();
        }}
        onClose={resetSheet}
      />
    </KeyboardAvoidingView>
  );
};

function useFilteredOptions(options: StructuredOptionChoice[], query: string) {
  return useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return options;
    }
    return options.filter((option) => option.name.toLowerCase().includes(normalized));
  }, [options, query]);
}

function CreateTopBar({
  topInset,
  submitting,
  onCancel,
}: {
  topInset: number;
  submitting: boolean;
  onCancel: () => void;
}) {
  return (
    <View style={[styles.topBar, { paddingTop: topInset + 14 }]}>
      <Pressable onPress={onCancel} disabled={submitting} style={styles.cancelButton}>
        <Text style={[styles.cancelText, submitting && styles.cancelTextDisabled]}>Cancel</Text>
      </Pressable>
      <Text style={styles.topTitle}>New Activity</Text>
      <View style={styles.topSpacer} />
    </View>
  );
}

function FormSection({
  step,
  title,
  sub,
  children,
}: {
  step: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionHeader}>
        <Text style={styles.stepBadge}>STEP {step}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        {sub ? <Text style={styles.sectionSub}>- {sub}</Text> : null}
      </View>
      <SectionCard style={styles.formCard}>{children}</SectionCard>
    </View>
  );
}

function FieldShell({
  label,
  error,
  helper,
  children,
  last,
}: {
  label: string;
  error?: string;
  helper?: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View style={[styles.fieldShell, !last && styles.fieldDivider]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {helper ? <Text style={styles.helperText}>{helper}</Text> : null}
      <FieldError message={error} />
    </View>
  );
}

function SelectorField({
  placeholder,
  valueNode,
  onPress,
  disabled,
}: {
  placeholder: string;
  valueNode: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable style={styles.selectorField} onPress={onPress} disabled={disabled}>
      <View style={styles.selectorContent}>
        {valueNode ?? <Text style={styles.placeholder}>{placeholder}</Text>}
      </View>
      <Text style={styles.selectorChevron}>›</Text>
    </Pressable>
  );
}

function StepperField({
  value,
  onChange,
  placeholder,
  disabled,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  error?: boolean;
}) {
  const numeric = Number.parseInt(value || '0', 10);

  return (
    <View style={[styles.stepper, error && styles.inputError]}>
      <Pressable
        style={styles.stepButton}
        disabled={disabled || !value || numeric <= 1}
        onPress={() => onChange(String(Math.max(1, numeric - 1)))}
      >
        <Text style={styles.stepButtonText}>-</Text>
      </Pressable>
      <TextInput
        style={styles.stepInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.text3}
        keyboardType="numeric"
        editable={!disabled}
      />
      <Pressable
        style={styles.stepButton}
        disabled={disabled}
        onPress={() => onChange(String((Number.isNaN(numeric) ? 0 : numeric) + 1))}
      >
        <Text style={styles.stepButtonText}>+</Text>
      </Pressable>
    </View>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(option.value)}
            disabled={disabled}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ChipControl<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.chipControl}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[styles.preferenceChip, active && styles.preferenceChipActive]}
            onPress={() => onChange(option.value)}
            disabled={disabled}
          >
            <Text style={[styles.preferenceChipText, active && styles.preferenceChipTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function OptionSheet({
  visible,
  title,
  options,
  query,
  onQuery,
  selectedId,
  emptyLabel,
  onSelect,
  onClose,
  renderOptionAccessory,
}: {
  visible: boolean;
  title: string;
  options: StructuredOptionChoice[];
  query: string;
  onQuery: (value: string) => void;
  selectedId: string;
  emptyLabel: string;
  onSelect: (option: StructuredOptionChoice) => void;
  onClose: () => void;
  renderOptionAccessory?: (option: StructuredOptionChoice) => React.ReactNode;
}) {
  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      <TextInput
        style={styles.sheetSearch}
        value={query}
        onChangeText={onQuery}
        placeholder="Search..."
        placeholderTextColor={colors.text3}
      />
      {options.length === 0 ? (
        <Text style={styles.emptyOptions}>{emptyLabel}</Text>
      ) : (
        options.map((option) => {
          const selected = option.optionId === selectedId;
          return (
            <Pressable
              key={option.optionId}
              style={[styles.optionRow, selected && styles.optionRowSelected]}
              onPress={() => onSelect(option)}
            >
              <View style={styles.optionMain}>
                <Text style={styles.optionLabel}>{option.name}</Text>
                {renderOptionAccessory ? renderOptionAccessory(option) : null}
              </View>
              {selected ? <Text style={styles.optionCheck}>✓</Text> : null}
            </Pressable>
          );
        })
      )}
    </BottomSheet>
  );
}

function DateTimeSheet({
  visible,
  title,
  initialDate,
  baseDate,
  allowClear,
  onClear,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  initialDate: Date | null | undefined;
  baseDate?: Date | null;
  allowClear?: boolean;
  onClear?: () => void;
  onConfirm: (value: Date) => void;
  onClose: () => void;
}) {
  const nearest = nearestFutureHour(baseDate ?? undefined);
  const [draft, setDraft] = useState<Date>(initialDate ?? nearest);

  React.useEffect(() => {
    if (visible) {
      setDraft(initialDate ?? nearestFutureHour(baseDate ?? undefined));
    }
  }, [baseDate, initialDate, visible]);

  const dates = useMemo(() => buildDateChoices(baseDate ?? undefined), [baseDate]);
  const times = ['09:00', '10:00', '12:30', '14:00', '15:00', '17:00', '19:30'];

  const setDraftDate = (date: Date) => {
    const next = new Date(date);
    next.setHours(draft.getHours(), draft.getMinutes(), 0, 0);
    setDraft(next);
  };

  const setDraftTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const next = new Date(draft);
    next.setHours(hour, minute, 0, 0);
    setDraft(next);
  };

  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      <Text style={styles.sheetSectionLabel}>Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateChoiceRow}>
        {dates.map((date) => {
          const active = sameDay(date, draft);
          return (
            <Pressable
              key={date.toDateString()}
              style={[styles.dateChoice, active && styles.dateChoiceActive]}
              onPress={() => setDraftDate(date)}
            >
              <Text style={[styles.dateChoiceDay, active && styles.dateChoiceTextActive]}>{formatDateChoiceDay(date)}</Text>
              <Text style={[styles.dateChoiceDate, active && styles.dateChoiceTextActive]}>
                {date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.sheetSectionLabel}>Time</Text>
      <View style={styles.timeGrid}>
        {times.map((time) => {
          const [hour, minute] = time.split(':').map(Number);
          const active = draft.getHours() === hour && draft.getMinutes() === minute;
          return (
            <Pressable
              key={time}
              style={[styles.timeChoice, active && styles.timeChoiceActive]}
              onPress={() => setDraftTime(time)}
            >
              <Text style={[styles.timeChoiceText, active && styles.timeChoiceTextActive]}>{time}</Text>
            </Pressable>
          );
        })}
      </View>

      <PrimaryButton label="Set date and time" onPress={() => onConfirm(draft)} style={styles.sheetConfirm} />
      {allowClear && onClear ? (
        <Pressable style={styles.clearDateButton} onPress={onClear}>
          <Text style={styles.clearDateText}>Clear end time</Text>
        </Pressable>
      ) : null}
    </BottomSheet>
  );
}

function validateCreateForm(args: {
  title: string;
  categoryId: string;
  meetingPointId: string;
  scheduledDateTime: Date | null;
  scheduledEndDateTime: Date | null;
  maxParticipants: string;
  participationMode: ParticipationMode;
  maxRequests: string;
}): FormErrors {
  const nextErrors: FormErrors = {};
  const categoryExists = args.categoryId.trim().length > 0;
  const meetingPointExists = args.meetingPointId.trim().length > 0;

  if (!args.title.trim()) {
    nextErrors.title = 'Please give your activity a title';
  }
  if (!categoryExists) {
    nextErrors.categoryId = 'Please choose a category';
  }
  if (!meetingPointExists) {
    nextErrors.meetingPointId = 'Please choose a meeting spot';
  }
  if (!args.scheduledDateTime) {
    nextErrors.scheduledDateTime = 'Please pick a date and time';
  } else if (args.scheduledDateTime.getTime() <= Date.now()) {
    nextErrors.scheduledDateTime = 'Pick a future date and time';
  }
  if (
    args.scheduledDateTime &&
    args.scheduledEndDateTime &&
    args.scheduledEndDateTime.getTime() <= args.scheduledDateTime.getTime()
  ) {
    nextErrors.scheduledEndDateTime = 'End time must be after start time';
  }
  if (!isPositiveIntegerString(args.maxParticipants)) {
    nextErrors.maxParticipants = 'Add at least 1 spot';
  }
  if (
    args.participationMode === 'approval_based' &&
    args.maxRequests.trim() &&
    !isPositiveIntegerString(args.maxRequests)
  ) {
    nextErrors.maxRequests = 'Use at least 1 request or leave it blank';
  }

  return nextErrors;
}

function isPositiveIntegerString(value: string): boolean {
  if (!/^[0-9]+$/.test(value.trim())) {
    return false;
  }
  return Number.parseInt(value.trim(), 10) > 0;
}

function nearestFutureHour(baseDate?: Date): Date {
  const base = baseDate ? new Date(baseDate.getTime() + 60 * 60 * 1000) : new Date(Date.now() + 60 * 60 * 1000);
  base.setMinutes(base.getMinutes() < 30 ? 30 : 0, 0, 0);
  if (base.getMinutes() === 0) {
    base.setHours(base.getHours() + 1);
  }
  return base;
}

function buildDateChoices(baseDate?: Date): Date[] {
  const start = baseDate ? new Date(baseDate) : new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 5 }).map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateChoiceDay(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (sameDay(date, today)) {
    return 'Today';
  }
  if (sameDay(date, tomorrow)) {
    return 'Tomorrow';
  }
  return date.toLocaleDateString([], { weekday: 'short' });
}

function formatDateTimeLabel(date: Date): string {
  return `${formatDateChoiceDay(date)}, ${formatTime(date)}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    paddingHorizontal: metrics.screenX,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelButton: {
    width: 70,
    height: 34,
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.text2,
    fontSize: 15,
    fontWeight: '800',
  },
  cancelTextDisabled: {
    color: colors.text3,
  },
  topTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  topSpacer: {
    width: 70,
  },
  content: {
    paddingTop: 4,
  },
  bannerWrap: {
    paddingHorizontal: metrics.screenX,
    marginBottom: 12,
  },
  sectionWrap: {
    marginHorizontal: metrics.screenX,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  stepBadge: {
    color: colors.text3,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  sectionSub: {
    color: colors.text3,
    fontSize: 12,
    fontWeight: '700',
  },
  formCard: {
    overflow: 'hidden',
  },
  fieldShell: {
    padding: 14,
  },
  fieldDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.bg,
    paddingHorizontal: 13,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  textArea: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.bg,
    paddingHorizontal: 13,
    paddingTop: 12,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  countText: {
    alignSelf: 'flex-end',
    color: colors.text3,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  selectorField: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.bg,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorContent: {
    flex: 1,
    minWidth: 0,
  },
  selectorChevron: {
    color: colors.text3,
    fontSize: 25,
    fontWeight: '400',
  },
  placeholder: {
    color: colors.text3,
    fontSize: 15,
    fontWeight: '700',
  },
  selectorValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  endTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  endTimeLink: {
    color: colors.skyDeep,
    fontSize: 13,
    fontWeight: '900',
  },
  removeLink: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
  },
  helperText: {
    color: colors.text3,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  stepper: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.bg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    color: colors.text2,
    fontSize: 22,
    fontWeight: '900',
  },
  stepInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  advancedInner: {
    overflow: 'hidden',
  },
  advancedHeader: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  advancedTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  advancedHelp: {
    color: colors.text3,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  chevron: {
    color: colors.text3,
    fontSize: 26,
    fontWeight: '600',
  },
  advancedBody: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    padding: 14,
  },
  controlLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  segmented: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  segment: {
    flex: 1,
    minHeight: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segmentText: {
    color: colors.text2,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  segmentTextActive: {
    color: colors.card,
  },
  advancedField: {
    marginBottom: 14,
  },
  preferenceLabel: {
    marginTop: 2,
  },
  chipControl: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.bg,
  },
  preferenceChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  preferenceChipText: {
    color: colors.text2,
    fontSize: 12,
    fontWeight: '900',
  },
  preferenceChipTextActive: {
    color: colors.primaryDeep,
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 12,
    paddingHorizontal: metrics.screenX,
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 10,
    elevation: 8,
  },
  sheetSearch: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    paddingHorizontal: 13,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  optionRow: {
    minHeight: 58,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: 8,
  },
  optionRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGhost,
  },
  optionMain: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  optionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  optionKind: {
    color: colors.text3,
    fontSize: 12,
    fontWeight: '700',
  },
  optionCheck: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 12,
  },
  emptyOptions: {
    color: colors.text2,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 30,
  },
  sheetSectionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 8,
  },
  dateChoiceRow: {
    gap: 8,
    paddingBottom: 8,
  },
  dateChoice: {
    minWidth: 92,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateChoiceActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dateChoiceDay: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  dateChoiceDate: {
    color: colors.text2,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  dateChoiceTextActive: {
    color: colors.card,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChoice: {
    width: '30.5%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  timeChoiceActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  timeChoiceText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  timeChoiceTextActive: {
    color: colors.card,
  },
  sheetConfirm: {
    marginTop: 18,
  },
  clearDateButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  clearDateText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '900',
  },
});
