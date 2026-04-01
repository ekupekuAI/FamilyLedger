import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface Family {
  id: string;
  name: string;
  family_code: string;
  created_by: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  name: string;
}

export interface Transaction {
  id: string;
  family_id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  amount: number;
  type: 'money_sent' | 'expense' | 'settlement';
  category: string | null;
  description: string | null;
  note: string | null;
  date: string;
  created_at: string;
}

export interface Notification {
  id: string;
  family_id: string;
  user_id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface FamilyContextType {
  family: Family | null;
  members: FamilyMember[];
  currentMember: FamilyMember | null;
  transactions: Transaction[];
  notifications: Notification[];
  loading: boolean;
  loadFamily: () => Promise<void>;
  createFamily: (name: string) => Promise<string>;
  joinFamily: (familyCode: string, name: string, role: string) => Promise<void>;
  sendMoney: (toMemberId: string, amount: number, note: string) => Promise<void>;
  logExpense: (
    memberId: string,
    amount: number,
    category: string,
    description: string,
    date: string
  ) => Promise<void>;
  settleUp: (fromMemberId: string, toMemberId: string, amount: number) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  getBalanceForMember: (memberId: string) => number;
  leaveFamily: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

function computeNetBalance(userId: string, txs: Transaction[]): number {
  let net = 0;
  for (const t of txs) {
    const amt = Number(t.amount);
    if (t.type === 'money_sent') {
      if (t.to_user_id === userId) net += amt;
      if (t.from_user_id === userId) net -= amt;
    } else if (t.type === 'expense') {
      if (t.from_user_id === userId) net -= amt;
    } else if (t.type === 'settlement') {
      if (t.to_user_id === userId) net += amt;
      if (t.from_user_id === userId) net -= amt;
    }
  }
  return net;
}

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [currentMember, setCurrentMember] = useState<FamilyMember | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadFamily = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: memberData, error: memErr } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memErr) throw memErr;

      if (!memberData) {
        setFamily(null);
        setMembers([]);
        setCurrentMember(null);
        setTransactions([]);
        setNotifications([]);
        return;
      }

      const { data: familyData, error: famErr } = await supabase
        .from('families')
        .select('*')
        .eq('id', memberData.family_id)
        .single();

      if (famErr) throw famErr;
      setFamily(familyData);

      const { data: allMembers, error: allMemErr } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', memberData.family_id);

      if (allMemErr) throw allMemErr;

      const userIds = [...new Set((allMembers ?? []).map((m) => m.user_id))];
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      const nameByUser = Object.fromEntries(
        (profs ?? []).map((p) => [p.id, p.display_name as string])
      );

      const mapped: FamilyMember[] = (allMembers ?? []).map((m) => ({
        id: m.id,
        family_id: m.family_id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        name: nameByUser[m.user_id] ?? 'User',
      }));

      setMembers(mapped);
      const me = mapped.find((m) => m.user_id === user.id);
      setCurrentMember(me ?? null);

      const { data: transactionsData, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('family_id', memberData.family_id)
        .order('created_at', { ascending: false });

      if (txErr) throw txErr;
      setTransactions((transactionsData ?? []) as Transaction[]);

      const { data: notificationsData, error: notErr } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (notErr) throw notErr;
      setNotifications((notificationsData ?? []) as Notification[]);
    } catch (error) {
      console.error('Error loading family:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFamily();
    } else {
      setFamily(null);
      setMembers([]);
      setCurrentMember(null);
      setTransactions([]);
      setNotifications([]);
    }
  }, [user, loadFamily]);

  const scheduleReload = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadFamily();
    }, 350);
  }, [loadFamily]);

  useEffect(() => {
    if (!user || !family?.id) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    const famId = family.id;
    const ch = supabase
      .channel(`ledger-${famId}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `family_id=eq.${famId}`,
        },
        scheduleReload
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        scheduleReload
      )
      .subscribe();

    channelRef.current = ch;

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [user, family?.id, scheduleReload]);

  const createFamily = async (name: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const familyCode = `FAM-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .insert({
        name,
        family_code: familyCode,
        created_by: user.id,
      })
      .select()
      .single();

    if (familyError) throw familyError;

    const { error: memberError } = await supabase.from('family_members').insert({
      family_id: familyData.id,
      user_id: user.id,
      role: 'parent',
    });

    if (memberError) throw memberError;

    await loadFamily();
    return familyCode;
  };

  const joinFamily = async (familyCode: string, name: string, role: string) => {
    if (!user) throw new Error('User not authenticated');

    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .select('*')
      .eq('family_code', familyCode.trim().toUpperCase())
      .maybeSingle();

    if (familyError) throw familyError;
    if (!familyData) throw new Error('Family not found');

    await supabase.from('profiles').upsert(
      { id: user.id, display_name: name },
      { onConflict: 'id' }
    );

    const { error: memberError } = await supabase.from('family_members').insert({
      family_id: familyData.id,
      user_id: user.id,
      role: role === 'parent' || role === 'child' ? role : 'member',
    });

    if (memberError) throw memberError;

    await loadFamily();
  };

  const sendMoney = async (toMemberId: string, amount: number, note: string) => {
    if (!family || !currentMember) throw new Error('No family or member');

    const toMember = members.find((m) => m.id === toMemberId);
    if (!toMember) throw new Error('Recipient not found');

    const { error: transactionError } = await supabase.from('transactions').insert({
      family_id: family.id,
      from_user_id: currentMember.user_id,
      to_user_id: toMember.user_id,
      amount,
      type: 'money_sent',
      note: note || null,
      date: new Date().toISOString().split('T')[0],
    });

    if (transactionError) throw transactionError;

    await supabase.from('notifications').insert({
      family_id: family.id,
      user_id: toMember.user_id,
      type: 'money_received',
      message: `${currentMember.name} sent you ₹${amount}${note ? ` — ${note}` : ''}`,
      is_read: false,
    });

    await loadFamily();
  };

  const logExpense = async (
    memberId: string,
    amount: number,
    category: string,
    description: string,
    date: string
  ) => {
    if (!family || !currentMember) throw new Error('No family or member');

    const member = members.find((m) => m.id === memberId);
    if (!member) throw new Error('Member not found');

    const { error } = await supabase.from('transactions').insert({
      family_id: family.id,
      from_user_id: member.user_id,
      to_user_id: null,
      amount,
      type: 'expense',
      category,
      description,
      date,
    });

    if (error) throw error;

    await supabase.from('notifications').insert({
      family_id: family.id,
      user_id: member.user_id,
      type: 'expense_logged',
      message: `Expense logged: ₹${amount} — ${category}${description ? ` (${description})` : ''}`,
      is_read: member.user_id === currentMember.user_id,
    });

    await loadFamily();
  };

  const settleUp = async (fromMemberId: string, toMemberId: string, amount: number) => {
    if (!family) throw new Error('No family');

    const fromMember = members.find((m) => m.id === fromMemberId);
    const toMember = members.find((m) => m.id === toMemberId);
    if (!fromMember || !toMember) throw new Error('Members not found');

    const { error } = await supabase.from('transactions').insert({
      family_id: family.id,
      from_user_id: fromMember.user_id,
      to_user_id: toMember.user_id,
      amount,
      type: 'settlement',
      date: new Date().toISOString().split('T')[0],
    });

    if (error) throw error;

    await supabase.from('notifications').insert({
      family_id: family.id,
      user_id: toMember.user_id,
      type: 'settlement',
      message: `${fromMember.name} settled ₹${amount} with you`,
      is_read: false,
    });

    await loadFamily();
  };

  const markNotificationRead = async (notificationId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    await loadFamily();
  };

  const markAllNotificationsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    await loadFamily();
  };

  const getBalanceForMember = useCallback(
    (memberId: string) => {
      const member = members.find((m) => m.id === memberId);
      if (!member) return 0;
      return computeNetBalance(member.user_id, transactions);
    },
    [members, transactions]
  );

  const leaveFamily = async () => {
    if (!currentMember) throw new Error('No member');

    await supabase.from('family_members').delete().eq('id', currentMember.id);

    setFamily(null);
    setMembers([]);
    setCurrentMember(null);
    setTransactions([]);
    setNotifications([]);
  };

  return (
    <FamilyContext.Provider
      value={{
        family,
        members,
        currentMember,
        transactions,
        notifications,
        loading,
        loadFamily,
        createFamily,
        joinFamily,
        sendMoney,
        logExpense,
        settleUp,
        markNotificationRead,
        markAllNotificationsRead,
        getBalanceForMember,
        leaveFamily,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}
