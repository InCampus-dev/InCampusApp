import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  BottomSheet,
  Chip,
  EmptyState,
  InlineBanner,
  LoadingRows,
  PrimaryButton,
  ScreenShell,
  SectionCard,
  TextField,
  TopBar,
  colors,
} from '../../components/InCampusUI';
import {
  type CampusStructuredOption,
  type CampusStructuredOptionType,
  createStructuredOption,
  deactivateStructuredOption,
  listStructuredOptions,
  updateStructuredOption,
} from '../../services/adminApi';
import { loadAdminContext, type AuthenticatedAdminContext } from '../../services/adminSession';
import { getApiErrorMessage } from '../../services/api';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminStructuredOptions'>;
type OptionFilter = 'all' | CampusStructuredOptionType;
type SheetMode = 'create' | 'edit';

const OPTION_TYPES: Array<{ value: CampusStructuredOptionType; label: string }> = [
  { value: 'activity_category', label: 'Activity category' },
  { value: 'campus_location', label: 'Meeting point' },
];

export default function AdminStructuredOptionsScreen({ navigation }: Props) {
  const [adminContext, setAdminContext] = useState<AuthenticatedAdminContext | null>(null);
  const [options, setOptions] = useState<CampusStructuredOption[]>([]);
  const [filter, setFilter] = useState<OptionFilter>('all');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>('create');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingOption, setEditingOption] = useState<CampusStructuredOption | null>(null);
  const [optionType, setOptionType] = useState<CampusStructuredOptionType>('activity_category');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [busyOptionId, setBusyOptionId] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const context = await loadAdminContext();
      setAdminContext(context);
      if (!context) {
        setOptions([]);
        setErrorMessage('Admin demo context is missing. Return to sign in and continue as demo admin.');
        return;
      }
      const data = await listStructuredOptions(context.selectedCampusId, {
        includeInactive: true,
        optionType: filter === 'all' ? undefined : filter,
      });
      setOptions(data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error) ?? 'Could not load structured options.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      fetchOptions();
    }, [fetchOptions])
  );

  const groupedOptions = useMemo(() => {
    return {
      activity_category: options.filter((option) => option.optionType === 'activity_category'),
      campus_location: options.filter((option) => option.optionType === 'campus_location'),
    };
  }, [options]);

  function openCreateSheet(nextType: CampusStructuredOptionType = 'activity_category') {
    setSheetMode('create');
    setEditingOption(null);
    setOptionType(nextType);
    setName('');
    setDescription('');
    setSheetVisible(true);
  }

  function openEditSheet(option: CampusStructuredOption) {
    setSheetMode('edit');
    setEditingOption(option);
    setOptionType(option.optionType);
    setName(option.name);
    setDescription(option.description ?? '');
    setSheetVisible(true);
  }

  async function submitOption() {
    if (!adminContext) {
      setErrorMessage('Admin demo context is missing. Return to sign in and continue as demo admin.');
      return;
    }
    const normalizedName = name.trim();
    if (!normalizedName) {
      setErrorMessage('Name is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (sheetMode === 'create') {
        await createStructuredOption(adminContext.selectedCampusId, {
          optionType,
          name: normalizedName,
          description: normalizedText(description),
        });
        setSuccessMessage('Structured option created.');
      } else if (editingOption) {
        await updateStructuredOption(adminContext.selectedCampusId, editingOption.optionId, {
          name: normalizedName,
          description: normalizedText(description),
        });
        setSuccessMessage('Structured option updated.');
      }
      setSheetVisible(false);
      await fetchOptions();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error) ?? 'Could not save structured option.');
    } finally {
      setSubmitting(false);
    }
  }

  async function setOptionActive(option: CampusStructuredOption, isActive: boolean) {
    if (!adminContext) {
      setErrorMessage('Admin demo context is missing. Return to sign in and continue as demo admin.');
      return;
    }

    setBusyOptionId(option.optionId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (isActive) {
        await updateStructuredOption(adminContext.selectedCampusId, option.optionId, { isActive: true });
        setSuccessMessage('Structured option reactivated.');
      } else {
        await deactivateStructuredOption(adminContext.selectedCampusId, option.optionId);
        setSuccessMessage('Structured option deactivated.');
      }
      await fetchOptions();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error) ?? 'Could not update structured option.');
    } finally {
      setBusyOptionId(null);
    }
  }

  return (
    <ScreenShell style={styles.screen}>
      <TopBar title="Structured Options" onBack={() => navigation.goBack()} rightLabel="Refresh" onRight={fetchOptions} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Campus-scoped options</Text>
          <Text style={styles.subtitle}>Maintain the categories and meeting points students use when creating activities.</Text>
        </View>

        {errorMessage ? <InlineBanner tone="error" text={errorMessage} actionLabel="Retry" onAction={fetchOptions} /> : null}
        {successMessage ? <InlineBanner tone="success" text={successMessage} /> : null}

        <View style={styles.filterRow}>
          <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} compact />
          <Chip
            label="Categories"
            selected={filter === 'activity_category'}
            onPress={() => setFilter('activity_category')}
            compact
          />
          <Chip
            label="Meeting points"
            selected={filter === 'campus_location'}
            onPress={() => setFilter('campus_location')}
            compact
            tone="blue"
          />
        </View>

        <View style={styles.createRow}>
          <PrimaryButton label="New category" onPress={() => openCreateSheet('activity_category')} style={styles.createButton} />
          <PrimaryButton label="New meeting point" tone="blue" onPress={() => openCreateSheet('campus_location')} style={styles.createButton} />
        </View>

        {loading ? (
          <LoadingRows count={4} />
        ) : options.length === 0 ? (
          <EmptyState
            icon="CA"
            title="No structured options"
            text="Create a category or meeting point for this campus."
            primaryLabel="Create option"
            onPrimary={() => openCreateSheet()}
          />
        ) : (
          <>
            {renderOptionGroup('Activity categories', groupedOptions.activity_category, openEditSheet, setOptionActive, busyOptionId)}
            {renderOptionGroup('Meeting points', groupedOptions.campus_location, openEditSheet, setOptionActive, busyOptionId)}
          </>
        )}
      </ScrollView>

      <BottomSheet
        visible={sheetVisible}
        title={sheetMode === 'create' ? 'Create option' : 'Edit option'}
        onClose={() => setSheetVisible(false)}
      >
        <View style={styles.sheetContent}>
          <View style={styles.typeRow}>
            {OPTION_TYPES.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={optionType === item.value}
                onPress={() => setOptionType(item.value)}
                disabled={sheetMode === 'edit'}
                compact
                tone={item.value === 'campus_location' ? 'blue' : 'green'}
              />
            ))}
          </View>
          <TextField label="Name" value={name} onChangeText={setName} placeholder="Option name" editable={!submitting} />
          <TextField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description"
            editable={!submitting}
            multiline
          />
          <PrimaryButton
            label={sheetMode === 'create' ? 'Create option' : 'Save changes'}
            loading={submitting}
            onPress={submitOption}
          />
        </View>
      </BottomSheet>
    </ScreenShell>
  );
}

function renderOptionGroup(
  title: string,
  options: CampusStructuredOption[],
  onEdit: (option: CampusStructuredOption) => void,
  onSetActive: (option: CampusStructuredOption, isActive: boolean) => void,
  busyOptionId: string | null
) {
  if (options.length === 0) {
    return null;
  }

  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {options.map((option) => (
        <StructuredOptionCard
          key={option.optionId}
          option={option}
          busy={busyOptionId === option.optionId}
          onEdit={() => onEdit(option)}
          onSetActive={(isActive) => onSetActive(option, isActive)}
        />
      ))}
    </View>
  );
}

function StructuredOptionCard({
  option,
  busy,
  onEdit,
  onSetActive,
}: {
  option: CampusStructuredOption;
  busy: boolean;
  onEdit: () => void;
  onSetActive: (isActive: boolean) => void;
}) {
  return (
    <SectionCard style={[styles.optionCard, !option.isActive && styles.inactiveCard]}>
      <View style={styles.optionHeader}>
        <View style={styles.optionText}>
          <Text style={styles.optionName}>{option.name}</Text>
          <Text style={styles.optionMeta}>{option.optionType === 'activity_category' ? 'Activity category' : 'Meeting point'}</Text>
        </View>
        <View style={[styles.statusPill, option.isActive ? styles.activePill : styles.inactivePill]}>
          <Text style={[styles.statusText, option.isActive ? styles.activeText : styles.inactiveText]}>
            {option.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      {option.description ? <Text style={styles.description}>{option.description}</Text> : null}
      <Text style={styles.optionId}>{option.optionId}</Text>
      <View style={styles.optionActions}>
        <Pressable style={styles.secondaryButton} onPress={onEdit} disabled={busy}>
          <Text style={styles.secondaryButtonText}>Edit</Text>
        </Pressable>
        {option.isActive ? (
          <Pressable style={styles.dangerButton} onPress={() => onSetActive(false)} disabled={busy}>
            <Text style={styles.dangerButtonText}>{busy ? 'Working...' : 'Deactivate'}</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.secondaryButton} onPress={() => onSetActive(true)} disabled={busy}>
            <Text style={styles.secondaryButtonText}>{busy ? 'Working...' : 'Reactivate'}</Text>
          </Pressable>
        )}
      </View>
    </SectionCard>
  );
}

function normalizedText(value: string): string | null {
  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 30, gap: 14 },
  header: { paddingHorizontal: 4 },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  subtitle: { color: colors.text2, fontSize: 13, fontWeight: '700', lineHeight: 19, marginTop: 5 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  createRow: { flexDirection: 'row', gap: 10 },
  createButton: { flex: 1 },
  group: { gap: 10 },
  groupTitle: { color: colors.text2, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', paddingLeft: 4 },
  optionCard: { padding: 14, gap: 10 },
  inactiveCard: { opacity: 0.72 },
  optionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  optionText: { flex: 1 },
  optionName: { color: colors.text, fontSize: 17, fontWeight: '900' },
  optionMeta: { color: colors.text2, fontSize: 12, fontWeight: '800', marginTop: 2 },
  description: { color: colors.text, fontSize: 13, fontWeight: '600', lineHeight: 19 },
  optionId: { color: colors.text3, fontSize: 11, fontWeight: '700' },
  statusPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  activePill: { backgroundColor: colors.primarySoft },
  inactivePill: { backgroundColor: colors.borderSoft },
  statusText: { fontSize: 11, fontWeight: '900' },
  activeText: { color: colors.primaryDeep },
  inactiveText: { color: colors.text2 },
  optionActions: { flexDirection: 'row', gap: 8 },
  secondaryButton: { flex: 1, minHeight: 42, borderRadius: 13, backgroundColor: colors.borderSoft, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  dangerButton: { flex: 1, minHeight: 42, borderRadius: 13, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  dangerButtonText: { color: colors.danger, fontSize: 13, fontWeight: '900' },
  sheetContent: { gap: 12, paddingBottom: 8 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
