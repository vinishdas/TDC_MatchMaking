'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Customer, SuggestedMatch } from '@/types';
import { getCustomerById, updateCustomerNotes } from '@/lib/dataRepository';
import { addScheduledCall } from '@/lib/calendarRepository';
import { findMatchesForCustomer } from '@/lib/matchingEngine';
import { fetchWithRetry } from '@/lib/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import { DebouncedButton } from '@/components/ui/DebouncedButton';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { 
  ArrowLeft, Calendar as CalendarIcon, ShieldCheck, 
  MapPin, BrainCircuit, CheckCircle2, Circle, GraduationCap,
  Briefcase, Heart, X, Search, Notebook, Zap, Sparkles, Send, Edit
} from 'lucide-react';
import styles from './customer.module.css';

export default function CustomerDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { showToast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [matches, setMatches] = useState<SuggestedMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnhancingMatches, setIsEnhancingMatches] = useState(false);
  const [newNote, setNewNote] = useState('');
  
  const [showMatches, setShowMatches] = useState(false);
  const [showAllMatches, setShowAllMatches] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Email Streaming Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<SuggestedMatch | null>(null);

  const [matchedPartner, setMatchedPartner] = useState<Customer | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const custData = await getCustomerById(id);
        if (custData) {
          setCustomer(custData);
          if (custData.statusTag === 'Matched' && custData.matchedWithId) {
            const partnerData = await getCustomerById(custData.matchedWithId);
            setMatchedPartner(partnerData || null);
          } else if (custData.suggestedMatches && custData.suggestedMatches.length > 0) {
            setMatches(custData.suggestedMatches);
            setShowMatches(true);
          }
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to load profile.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, showToast]);

  const handleProposeMatch = async () => {
    if (!customer) return;
    setShowMatches(true);
    setIsEnhancingMatches(true);
    try {
      const initialMatches = await findMatchesForCustomer(customer);
      if (initialMatches.length === 0) {
        setMatches([]);
        setIsEnhancingMatches(false);
        return;
      }
      
      const response = await fetchWithRetry('/api/ai/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customer,
          candidates: initialMatches.map((m: SuggestedMatch) => m.profile)
        })
      });
      
      let finalMatches = initialMatches;
      if (response.ok) {
        const data = await response.json();
        if (data.scoredMatches) finalMatches = data.scoredMatches;
      }
      
      setMatches(finalMatches);
      
      // Save suggestedMatches to db
      await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestedMatches: finalMatches })
      });
      
    } catch (e) {
      console.error('Match failed', e);
    } finally {
      setIsEnhancingMatches(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !customer) return;
    const updatedNotes = [...(customer.notes || []), newNote.trim()];
    setCustomer({ ...customer, notes: updatedNotes });
    setNewNote('');
    
    try {
      await updateCustomerNotes(customer.id, updatedNotes);
      showToast('Note added successfully', 'success');
    } catch (e) {
      showToast('Failed to save note', 'error');
    }
  };

  const openEmailModal = async (match: SuggestedMatch) => {
    if (!customer) return;
    setSelectedMatch(match);
    setShowEmailModal(true);
    setEmailDraft('');
    setIsStreaming(true);

    try {
      const response = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer, matchProfile: match.profile })
      });

      if (!response.body) throw new Error('No readable stream');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setEmailDraft(prev => prev + chunk);
      }
    } catch (e) {
      console.error(e);
      showToast('Error generating AI draft.', 'error');
      setEmailDraft('There was an error connecting to the AI. Please write the email manually.');
    } finally {
      setIsStreaming(false);
    }
  };

  const sendEmail = async () => {
    showToast('Match proposal email sent successfully!', 'success');
    setShowEmailModal(false);
    
    if (customer && customer.statusTag !== 'Matched') {
      try {
        await fetch(`/api/customers/${customer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statusTag: 'Pending Match' })
        });
        setCustomer({ ...customer, statusTag: 'Pending Match' });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleMatchClient = async (matchProfile: Customer) => {
    if (!customer) return;
    try {
      // Update this customer
      await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusTag: 'Matched', matchedWithId: matchProfile.id })
      });
      // Update target customer
      await fetch(`/api/customers/${matchProfile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusTag: 'Matched', matchedWithId: customer.id })
      });
      setCustomer({ ...customer, statusTag: 'Matched', matchedWithId: matchProfile.id });
      setMatchedPartner(matchProfile);
      showToast('Client successfully matched!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to match client', 'error');
    }
  };

  const handleScheduleCall = async () => {
    if (!customer) return;
    try {
      await addScheduledCall({
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        date: selectedDate.toISOString()
      });
      showToast('Call scheduled and added to calendar.', 'success');
      setShowCalendar(false);
    } catch (e) {
      showToast('Failed to schedule call.', 'error');
    }
  };

  if (isLoading) return <div className={styles.container}>Loading profile...</div>;
  if (!customer) return <div className={styles.container}>Customer not found.</div>;

  const notes = customer.notes || [];
  const displayedMatches = showAllMatches ? matches : matches.slice(0, 3);

  return (
    <div className={styles.container}>
      <div className={styles.topActionsRow}>
        <button className={styles.backBtn} onClick={() => router.push('/dashboard/clients')}>
          <ArrowLeft size={16} /> Back to Clients
        </button>
        <div className={styles.topRightActions}>
          <button className={styles.outlineBtn} onClick={() => setShowCalendar(true)}>
            <CalendarIcon size={16} /> Schedule Call
          </button>
        </div>
      </div>

      {showCalendar && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Schedule Call</h3>
              <button onClick={() => setShowCalendar(false)}><X size={20} /></button>
            </div>
            <div className={styles.calendarWrapper}>
              <Calendar 
                onChange={(value) => setSelectedDate(value as Date)} 
                value={selectedDate} 
                className={styles.reactCalendarCustom}
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.outlineBtn} onClick={() => setShowCalendar(false)}>Cancel</button>
              <DebouncedButton className={styles.solidBtnDark} onClickAction={handleScheduleCall}>Confirm Schedule</DebouncedButton>
            </div>
          </div>
        </div>
      )}

      {showEmailModal && selectedMatch && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContentWide}>
            <div className={styles.modalHeader}>
              <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <Sparkles size={18} color="var(--color-secondary)" /> 
                Draft Match Proposal: {selectedMatch.profile.firstName}
              </h3>
              <button onClick={() => setShowEmailModal(false)}><X size={20} /></button>
            </div>
            <div className={styles.emailEditorContainer}>
              <p className={styles.emailContext}>Review and edit the AI-generated email before sending to {customer.firstName}.</p>
              <textarea 
                className={styles.emailTextarea} 
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                disabled={isStreaming}
                placeholder="Generating AI Draft..."
              />
              {isStreaming && <p className={styles.streamingIndicator}>AI is writing...</p>}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.outlineBtn} onClick={() => setShowEmailModal(false)}>Cancel</button>
              <DebouncedButton 
                className={styles.solidBtnPrimary} 
                onClickAction={async () => sendEmail()}
                disabled={isStreaming}
              >
                <Send size={16} /> Send Email
              </DebouncedButton>
            </div>
          </div>
        </div>
      )}

      {/* Hero Card */}
      <div className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <img 
            src={customer.gender === 'Female' 
              ? 'https://api.dicebear.com/7.x/notionists/svg?seed=female&backgroundColor=f3ebe1'
              : 'https://api.dicebear.com/7.x/notionists/svg?seed=male&backgroundColor=e6eef5'
            } 
            alt="Profile" 
            className={styles.heroAvatarImage} 
          />
          <div className={styles.heroText}>
            <h1 className={styles.heroName}>{customer.firstName} {customer.lastName}, {customer.age}</h1>
            <p className={styles.heroLocation}>
              <MapPin size={16} className={styles.heroIcon} /> 
              {customer.city}, {customer.country || 'Not specified'}
            </p>
          </div>
        </div>
        <div className={styles.heroRight}>
          <div className={styles.aiReadinessBox}>
            <div className={styles.aiReadinessTextGroup}>
              <span className={styles.aiReadinessLabel}>AI READINESS</span>
              <span className={styles.aiReadinessScore}>92/100</span>
            </div>
            <div className={styles.aiReadinessIconBox}>
              <BrainCircuit size={28} />
            </div>
          </div>
            <button 
            className={styles.proposeMatchBtn}
            onClick={() => {
              handleProposeMatch();
              setTimeout(() => {
                document.getElementById('matches-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
          >
            {customer.suggestedMatches && customer.suggestedMatches.length > 0 ? "Re-run Match AI" : "Propose Match"}
          </button>
        </div>
      </div>

      <h2 className={styles.sectionHeader}>Matchmaking Journey</h2>
      <div className={styles.stepperContainer}>
        <div className={styles.step}>
          <div className={styles.stepCircleActive}><CheckCircle2 size={24} /></div>
          <span>Onboarded</span>
        </div>
        <div className={styles.stepLineActive}></div>
        <div className={styles.step}>
          <div className={styles.stepCircleActive}><CheckCircle2 size={24} /></div>
          <span>Verified</span>
        </div>
        <div className={styles.stepLineActive}></div>
        <div className={styles.step}>
          <div className={customer.statusTag === 'Active Search' ? styles.stepCircleCurrent : styles.stepCircleActive}><Search size={20} /></div>
          <span style={customer.statusTag === 'Active Search' ? { fontWeight: 600 } : {}}>Active Search</span>
        </div>
        <div className={customer.statusTag !== 'Active Search' ? styles.stepLineActive : styles.stepLine}></div>
        <div className={styles.step}>
          <div className={customer.statusTag === 'Pending Match' ? styles.stepCircleCurrent : (customer.statusTag === 'Matched' ? styles.stepCircleActive : styles.stepCircle)}><Heart size={20} /></div>
          <span style={customer.statusTag === 'Pending Match' ? { fontWeight: 600 } : {}}>Introductions</span>
        </div>
        <div className={customer.statusTag === 'Matched' ? styles.stepLineActive : styles.stepLine}></div>
        <div className={styles.step}>
          <div className={customer.statusTag === 'Matched' ? styles.stepCircleCurrent : styles.stepCircle}><ShieldCheck size={20} /></div>
          <span style={customer.statusTag === 'Matched' ? { fontWeight: 600 } : {}}>Success</span>
        </div>
      </div>

      {/* Structured Biodata Layout */}
      <h2 className={styles.sectionHeader} style={{marginTop: '3rem'}}>Client Biodata</h2>
      
      <div className={styles.bentoGrid}>
        
        {/* Row 1: Personal & Professional */}
        <div className={`${styles.bentoCard} ${styles.bentoPersonal}`}>
          <div className={styles.cardHeader}><h3>Personal Info</h3></div>
          <div className={styles.bentoDataList}>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Name</div>
              <div className={styles.bentoDataValue}>{customer.firstName} {customer.lastName}</div>
            </div>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Gender</div>
              <div className={styles.bentoDataValue}>{customer.gender}</div>
            </div>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Age & DOB</div>
              <div className={styles.bentoDataValue}>{customer.age} ({customer.dateOfBirth})</div>
            </div>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Height</div>
              <div className={styles.bentoDataValue}>{customer.height} ({customer.heightCm} cm)</div>
            </div>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Location</div>
              <div className={styles.bentoDataValue}>{customer.city}, {customer.country}</div>
            </div>
          </div>
        </div>

        <div className={`${styles.bentoCard} ${styles.bentoProfessional}`}>
          <div className={styles.cardHeader}><h3>Professional</h3></div>
          <div className={styles.bentoDataList}>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Education</div>
              <div className={styles.bentoDataValue}>{customer.degree}, {customer.undergraduateCollege}</div>
            </div>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Occupation</div>
              <div className={styles.bentoDataValue}>{customer.designation} at {customer.currentCompany}</div>
            </div>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Income</div>
              <div className={styles.bentoDataValue}>{customer.income ? `₹${(customer.income/100000).toFixed(1)} LPA` : 'Not Specified'}</div>
            </div>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Email</div>
              <div className={styles.bentoDataValue}>{customer.email}</div>
            </div>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Phone</div>
              <div className={styles.bentoDataValue}>{customer.phoneNumber}</div>
            </div>
          </div>
        </div>

        {/* Row 2: Sociocultural, Astrological & Non-Negotiables */}
        <div className={`${styles.bentoCard} ${styles.bentoSociocultural}`}>
          <div className={styles.cardHeader}><h3>Cultural & Family</h3></div>
          <div className={styles.bentoDataList}>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Religion / Caste</div>
              <div className={styles.bentoDataValue}>{customer.religion || 'N/A'} / {customer.caste || 'N/A'}</div>
            </div>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Mother Tongue</div>
              <div className={styles.bentoDataValue}>{customer.motherTongue || 'N/A'}</div>
            </div>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Languages</div>
              <div className={styles.bentoDataValue}>{customer.languagesKnown?.join(', ') || 'N/A'}</div>
            </div>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Family Structure</div>
              <div className={styles.bentoDataValue}>{customer.familyBackground || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div className={`${styles.bentoCard} ${styles.bentoAstrological}`}>
          <div className={styles.cardHeader}><h3>Astrological</h3></div>
          <div className={styles.bentoDataList}>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Birth Time</div>
              <div className={styles.bentoDataValue}>{customer.birthTime || 'N/A'}</div>
            </div>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Birth Place</div>
              <div className={styles.bentoDataValue}>{customer.birthPlace || 'N/A'}</div>
            </div>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Manglik Status</div>
              <div className={styles.bentoDataValue}>{customer.manglikStatus || 'N/A'}</div>
            </div>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Gotra</div>
              <div className={styles.bentoDataValue}>{customer.gotra || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div className={`${styles.bentoCard} ${styles.bentoNonNegotiables}`}>
          <div className={styles.cardHeader}>
            <h3 style={{color: 'var(--color-secondary)'}}><ShieldCheck size={18} /> Non-Negotiables</h3>
          </div>
          <div className={styles.nonNegotiablesList}>
            <div className={styles.nnItem}>
              <strong>Want Kids:</strong> {customer.wantKids}
            </div>
            <div className={styles.nnItem}>
              <strong>Relocate:</strong> {customer.openToRelocate}
            </div>
            <div className={styles.nnItem}>
              <strong>Pets:</strong> {customer.openToPets}
            </div>
            <div className={styles.nnItem}>
              <strong>Dietary:</strong> {customer.dietaryPreferences || 'Any'}
            </div>
          </div>
        </div>

        {/* Row 3: Notes (Span 2) and Preferences */}
        <div className={`${styles.bentoCard} ${styles.bentoPreferences}`}>
          <div className={styles.cardHeader}><h3>Lifestyle & Partner Preferences</h3></div>
          <div className={styles.bentoDataList}>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Smoking / Drinking</div>
              <div className={styles.bentoDataValue}>{customer.smokingHabits || 'N/A'} / {customer.drinkingHabits || 'N/A'}</div>
            </div>
            <div className={styles.bentoDataGroup}>
              <div className={styles.bentoDataLabel}>Marital Status</div>
              <div className={styles.bentoDataValue}>{customer.maritalStatus}</div>
            </div>
            {customer.lifestylePreferences && (
              <div className={styles.bentoDataGroup}>
                <div className={styles.bentoDataLabel}>Lifestyle</div>
                <div className={styles.bentoDataValue}>{customer.lifestylePreferences}</div>
              </div>
            )}
            {customer.familyValues && (
              <div className={styles.bentoDataGroup}>
                <div className={styles.bentoDataLabel}>Values</div>
                <div className={styles.bentoDataValue}>{customer.familyValues}</div>
              </div>
            )}
            {customer.partnerPreferences && (
              <div className={styles.bentoDataGroup}>
                <div className={styles.bentoDataLabel}>Looking For</div>
                <div className={styles.bentoDataValue}>{customer.partnerPreferences}</div>
              </div>
            )}
          </div>
        </div>

        <div className={`${styles.bentoCard} ${styles.notesCard}`}>
            <div className={styles.cardHeader}>
              <h3><Notebook size={18} /> Matchmaker Notes</h3>
            </div>
            <div className={styles.cardContent}>
              {notes.length > 0 ? (
                notes.map((note, idx) => <p key={idx} className={styles.noteText}>• {note}</p>)
              ) : (
                <p className={styles.noteText}>No notes available for this client.</p>
              )}
              
              <div className={styles.addNoteSection}>
                <textarea 
                  className={styles.noteInput}
                  placeholder="Add new follow-up required..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <DebouncedButton onClickAction={handleAddNote} className={styles.solidBtnDark}>
                  Save
                </DebouncedButton>
              </div>
            </div>
        </div>
      </div>

      {customer.statusTag === 'Matched' && matchedPartner && (
        <div className={styles.aiMatchesSection} style={{ marginTop: '2rem' }}>
          <div className={styles.cardHeader}>
            <h3 style={{color: 'var(--color-primary)'}}><Heart size={20} /> Matched Partner</h3>
          </div>
          <div className={styles.bentoCard} style={{ cursor: 'pointer' }} onClick={() => router.push(`/dashboard/customer/${matchedPartner.id}`)}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <img 
                src={matchedPartner.gender === 'Female' 
                  ? 'https://api.dicebear.com/7.x/notionists/svg?seed=female&backgroundColor=f3ebe1'
                  : 'https://api.dicebear.com/7.x/notionists/svg?seed=male&backgroundColor=e6eef5'
                } 
                alt="Partner" 
                style={{ width: '80px', height: '80px', borderRadius: '50%' }}
              />
              <div>
                <h4 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{matchedPartner.firstName} {matchedPartner.lastName}</h4>
                <p style={{ color: 'var(--color-text-light)' }}>{matchedPartner.age} • {matchedPartner.designation} • {matchedPartner.city}</p>
                <p style={{ marginTop: '0.5rem', fontWeight: 500, color: 'var(--color-secondary)' }}>Status: Successfully Matched</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMatches && customer.statusTag !== 'Matched' && (
        <div className={styles.aiMatchesSection} id="matches-section">
          <div className={styles.cardHeader}>
            <h3><Sparkles size={20} color="var(--color-secondary)" /> AI Curated Matches</h3>
            {isEnhancingMatches && <span className={styles.aiLoading}>Analyzing compatibility...</span>}
            <button 
              className={styles.textBtn}
              onClick={() => setShowAllMatches(!showAllMatches)}
            >
              {showAllMatches ? 'SHOW LESS' : 'VIEW ALL'} <ArrowLeft size={16} style={{transform: 'rotate(180deg)'}} />
            </button>
          </div>
          <p className={styles.subtitleText}>Highly compatible profiles evaluated based on {customer.firstName}&apos;s core values and strict filters.</p>
          
          <div className={styles.aiMatchesGrid}>
            {displayedMatches.map(match => {
              const placeholderUrl = match.profile.gender === 'Female' 
                ? 'https://api.dicebear.com/7.x/notionists/svg?seed=female&backgroundColor=f3ebe1'
                : 'https://api.dicebear.com/7.x/notionists/svg?seed=male&backgroundColor=e6eef5';
              return (
              <div key={match.profile.id} className={styles.aiMatchCard}>
                <div 
                  className={styles.aiMatchAvatarPlaceholder}
                  style={{ backgroundImage: `url(${placeholderUrl})`, backgroundSize: 'cover' }}
                  onClick={() => router.push(`/dashboard/customer/${match.profile.id}`)}
                  title="View Profile"
                >
                    <div className={styles.matchScoreBadge}>
                      <Zap size={12} style={{marginRight: '4px'}} /> {match.matchScore.score}%
                    </div>
                </div>
                <div className={styles.aiMatchInfo}>
                  <div className={styles.matchLabel}>{match.matchScore.label}</div>
                  <h4 
                    className={styles.clickableName} 
                    onClick={() => router.push(`/dashboard/customer/${match.profile.id}`)}
                  >
                    {match.profile.firstName} {match.profile.lastName}
                  </h4>
                  <p className={styles.matchDesignation}>{match.profile.designation}, {match.profile.age}</p>
                  <p className={styles.matchReasoning}>&quot;{match.matchScore.reasoning}&quot;</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <DebouncedButton 
                      className={styles.sendMatchBtn}
                      onClickAction={async () => openEmailModal(match)}
                      style={{ flex: 1 }}
                    >
                      SEND MATCH
                    </DebouncedButton>
                    <DebouncedButton 
                      className={styles.solidBtnDark}
                      onClickAction={async () => handleMatchClient(match.profile)}
                      style={{ flex: 1 }}
                    >
                      MATCH
                    </DebouncedButton>
                  </div>
                </div>
              </div>
            )})}
            {matches.length === 0 && !isEnhancingMatches && (
              <p style={{padding: '2rem'}}>No highly compatible matches found currently.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
