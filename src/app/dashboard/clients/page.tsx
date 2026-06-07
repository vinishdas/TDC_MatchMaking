'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Search, ListFilter, CheckCircle2, Circle } from 'lucide-react';
import { getCustomers } from '@/lib/dataRepository';
import { Customer } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { DebouncedButton } from '@/components/ui/DebouncedButton';
import styles from './dashboard.module.css';

export default function ClientsGrid() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  
  const ITEMS_PER_PAGE = 9;
  
  const router = useRouter();
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (error) {
        console.error('Failed to fetch customers', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    let result = customers;

    if (debouncedSearch) {
      const lowerQuery = debouncedSearch.toLowerCase();
      result = result.filter(c => 
        c.firstName.toLowerCase().includes(lowerQuery) ||
        c.lastName.toLowerCase().includes(lowerQuery) ||
        c.city.toLowerCase().includes(lowerQuery) ||
        c.id.toLowerCase().includes(lowerQuery)
      );
    }

    if (ageRange) {
      const [min, max] = ageRange.split('-').map(Number);
      if (max) {
        result = result.filter(c => c.age >= min && c.age <= max);
      } else if (min) {
        result = result.filter(c => c.age >= min);
      }
    }

    if (genderFilter) {
      result = result.filter(c => c.gender.toLowerCase() === genderFilter.toLowerCase());
    }

    if (dietaryFilter) {
      result = result.filter(c => c.dietaryPreferences?.toLowerCase() === dietaryFilter.toLowerCase());
    }

    if (statusFilter) {
      result = result.filter(c => c.statusTag.toLowerCase() === statusFilter.toLowerCase());
    }

    return result;
  }, [customers, debouncedSearch, ageRange, genderFilter, dietaryFilter, statusFilter]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

  const handleCardClick = (id: string) => {
    router.push(`/dashboard/customer/${id}`);
  };

  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Verified Clients</h1>
          <p className={styles.subtitle}>{filteredCustomers.length} Authenticated Profiles</p>
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} size={18} />
          <input 
            type="text" 
            placeholder="Search by Name or ID" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        
        <select className={styles.select} defaultValue="">
          <option value="" disabled>Verification Date</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>

        <select 
          className={styles.select} 
          value={ageRange}
          onChange={(e) => {
            setAgeRange(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Age Range</option>
          <option value="20-30">20 - 30</option>
          <option value="31-40">31 - 40</option>
          <option value="41-50">41 - 50</option>
          <option value="51-">51+</option>
        </select>

        <button 
          className={styles.moreFiltersBtn}
          onClick={() => setShowMoreFilters(!showMoreFilters)}
        >
          <ListFilter size={18} /> More Filters
        </button>
      </div>

      {showMoreFilters && (
        <div className={styles.expandedFilters}>
          <div className={styles.filterGroup}>
            <label>Gender</label>
            <select className={styles.select} value={genderFilter} onChange={e => { setGenderFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">Any</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Dietary</label>
            <select className={styles.select} value={dietaryFilter} onChange={e => { setDietaryFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">Any</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Vegan">Vegan</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Status</label>
            <select className={styles.select} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">Any Status</option>
              <option value="Active Search">Active Search</option>
              <option value="Pending Match">Pending Match</option>
              <option value="Matched">Matched</option>
            </select>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`${styles.card} ${styles.skeletonCard}`}>
              <div className="skeleton" style={{height: '80px', width: '100%', marginBottom: '1rem'}}></div>
              <div className="skeleton" style={{height: '20px', width: '60%', marginBottom: '0.5rem'}}></div>
              <div className="skeleton" style={{height: '20px', width: '80%'}}></div>
            </div>
          ))}
        </div>
      ) : paginatedCustomers.length === 0 ? (
        <div className={styles.emptyState}>
          <Search size={48} className={styles.emptyIcon} />
          <h3>No matching clients found</h3>
          <p>Try adjusting your search filters or clearing the age range to see more results.</p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {paginatedCustomers.map(customer => {
              const placeholderUrl = customer.gender === 'Female' 
                ? 'https://api.dicebear.com/7.x/notionists/svg?seed=female&backgroundColor=f3ebe1'
                : 'https://api.dicebear.com/7.x/notionists/svg?seed=male&backgroundColor=e6eef5';

              return (
              <div key={customer.id} className={styles.cardPrimary}>
                <div className={styles.cardHeader}>
                  <img src={placeholderUrl} alt="Avatar" className={styles.profileAvatarImg} />
                  <div className={styles.cardInfo}>
                    <h3 className={styles.cardName}>{customer.firstName} {customer.lastName}, {customer.age}</h3>
                    <p className={styles.cardId}>{customer.city} • {customer.maritalStatus}</p>
                    <div style={{marginTop: '0.5rem'}}>
                      <span className={`${styles.statusBadge} ${styles[customer.statusTag.replace(/\s+/g, '')] || ''}`}>
                        {customer.statusTag}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.verifications}>
                  <p className={styles.sectionLabel}>VERIFICATIONS</p>
                  <div className={styles.tagGroup}>
                    <span className={styles.verifiedTag}><CheckCircle2 size={12} /> ID</span>
                    <span className={styles.verifiedTag}><CheckCircle2 size={12} /> Income</span>
                    <span className={styles.verifiedTag}><CheckCircle2 size={12} /> Family</span>
                    <span className={styles.unverifiedTag}><Circle size={12} /> Background</span>
                  </div>
                </div>

                <div className={styles.criteria}>
                  <p className={styles.sectionLabel}>MATCH PREFERENCES</p>
                  <p className={styles.criteriaText}>
                    Kids: {customer.wantKids} • Relocate: {customer.openToRelocate} • Pets: {customer.openToPets}
                  </p>
                </div>

                <div className={styles.cardActions}>
                  <button 
                    className={styles.viewBtnPrimary}
                    onClick={() => handleCardClick(customer.id)}
                  >
                    View Full Profile
                  </button>
                </div>
              </div>
            )})}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
