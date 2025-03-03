// Environment-aware Supabase client configuration
// This file provides an implementation of the Supabase client
// that uses our custom auth service and the appropriate database connection
// based on the current environment (browser or Node.js)
import { auth } from '@/utils/authService';
import { executeQuery, getDatabaseConnectionInfo } from '@/utils/databaseUtils';
import { isBrowser } from '@/utils/environmentUtils';
import type { Database } from './types';

// Log environment and connection information for debugging
console.log('Environment variables available:', {
  VITE_DATABASE_URL: import.meta.env.VITE_DATABASE_URL,
});

// Log database connection information
console.log('Database connection info:', getDatabaseConnectionInfo());

// Create a Supabase client that uses our custom auth service and the appropriate database connection
export const supabase = {
  // Auth methods
  auth: {
    getSession: auth.getSession.bind(auth),
    getUser: auth.getUser.bind(auth),
    signInWithPassword: auth.signIn.bind(auth),
    signUp: auth.signUp.bind(auth),
    signOut: auth.signOut.bind(auth),
    onAuthStateChange: auth.onAuthStateChange.bind(auth),
  },
  
  // Database methods
  from: (table: string) => ({
    select: (columns: string = '*') => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          try {
            const result = await executeQuery(`SELECT ${columns} FROM ${table} WHERE ${column} = $1 LIMIT 1`, [value]);
            return { data: result.rows[0] || null, error: null };
          } catch (error) {
            console.error('Error in supabase.from.select.eq.single:', error);
            return { data: null, error };
          }
        },
        maybeSingle: async () => {
          try {
            const result = await executeQuery(`SELECT ${columns} FROM ${table} WHERE ${column} = $1 LIMIT 1`, [value]);
            return { data: result.rows[0] || null, error: null };
          } catch (error) {
            console.error('Error in supabase.from.select.eq.maybeSingle:', error);
            return { data: null, error };
          }
        },
        order: (column: string, { ascending = true } = {}) => ({
          limit: (limit: number) => ({
            execute: async () => {
              try {
                const result = await executeQuery(
                  `SELECT ${columns} FROM ${table} WHERE ${column} = $1 ORDER BY ${column} ${ascending ? 'ASC' : 'DESC'} LIMIT $2`,
                  [value, limit]
                );
                return { data: result.rows, error: null };
              } catch (error) {
                console.error('Error in supabase.from.select.eq.order.limit.execute:', error);
                return { data: null, error };
              }
            }
          })
        }),
        execute: async () => {
          try {
            const result = await executeQuery(`SELECT ${columns} FROM ${table} WHERE ${column} = $1`, [value]);
            return { data: result.rows, error: null };
          } catch (error) {
            console.error('Error in supabase.from.select.eq.execute:', error);
            return { data: null, error };
          }
        }
      }),
      not: (column: string, operator: string, value: any) => ({
        execute: async () => {
          try {
            // In a real implementation, this would use NOT IS NULL for checking non-null values
            // For our mock, we'll just filter out null values
            const result = await executeQuery(`SELECT ${columns} FROM ${table}`, []);
            const filteredRows = result.rows.filter(row => {
              if (operator === 'is') {
                return row[column] !== value;
              }
              return true;
            });
            return { data: filteredRows, error: null };
          } catch (error) {
            console.error('Error in supabase.from.select.not.execute:', error);
            return { data: null, error };
          }
        }
      }),
      ilike: (column: string, value: any) => ({
        limit: (limit: number) => ({
          execute: async () => {
            try {
              // In a real implementation, this would use ILIKE for case-insensitive matching
              // For our mock, we'll just do a simple case-insensitive comparison
              const result = await executeQuery(`SELECT ${columns} FROM ${table} LIMIT $1`, [limit]);
              const filteredRows = result.rows.filter(row => {
                const columnValue = row[column];
                return columnValue && columnValue.toLowerCase().includes(value.toLowerCase());
              });
              return { data: filteredRows, error: null };
            } catch (error) {
              console.error('Error in supabase.from.select.ilike.limit.execute:', error);
              return { data: null, error };
            }
          }
        }),
        execute: async () => {
          try {
            // In a real implementation, this would use ILIKE for case-insensitive matching
            // For our mock, we'll just do a simple case-insensitive comparison
            const result = await executeQuery(`SELECT ${columns} FROM ${table}`, []);
            const filteredRows = result.rows.filter(row => {
              const columnValue = row[column];
              return columnValue && columnValue.toLowerCase().includes(value.toLowerCase());
            });
            return { data: filteredRows, error: null };
          } catch (error) {
            console.error('Error in supabase.from.select.ilike.execute:', error);
            return { data: null, error };
          }
        },
        single: async () => {
          try {
            // In a real implementation, this would use ILIKE for case-insensitive matching
            // For our mock, we'll just do a simple case-insensitive comparison
            const result = await executeQuery(`SELECT ${columns} FROM ${table} LIMIT 1`, []);
            const filteredRows = result.rows.filter(row => {
              const columnValue = row[column];
              return columnValue && columnValue.toLowerCase().includes(value.toLowerCase());
            });
            return { data: filteredRows[0] || null, error: null };
          } catch (error) {
            console.error('Error in supabase.from.select.ilike.single:', error);
            return { data: null, error };
          }
        }
      }),
      execute: async () => {
        try {
          const result = await executeQuery(`SELECT ${columns} FROM ${table}`);
          return { data: result.rows, error: null };
        } catch (error) {
          console.error('Error in supabase.from.select.execute:', error);
          return { data: null, error };
        }
      }
    }),
    insert: (data: any[]) => ({
      execute: async () => {
        try {
          // Handle array of data or single object
          const dataArray = Array.isArray(data) ? data : [data];
          const firstItem = dataArray[0];
          
          const columns = Object.keys(firstItem).join(', ');
          const placeholders = dataArray.map((_, rowIndex) => 
            `(${Object.keys(firstItem).map((_, colIndex) => 
              `$${rowIndex * Object.keys(firstItem).length + colIndex + 1}`
            ).join(', ')})`
          ).join(', ');
          
          // Flatten all values into a single array
          const values = dataArray.flatMap(item => Object.values(item));
          
          const result = await executeQuery(
            `INSERT INTO ${table} (${columns}) VALUES ${placeholders} RETURNING *`,
            values
          );
          
          return { data: result.rows, error: null };
        } catch (error) {
          console.error('Error in supabase.from.insert.execute:', error);
          return { data: null, error };
        }
      },
      select: (returnColumns: string = '*') => ({
        single: async () => {
          try {
            // Handle array of data or single object
            const dataArray = Array.isArray(data) ? data : [data];
            const firstItem = dataArray[0];
            
            const columns = Object.keys(firstItem).join(', ');
            const placeholders = dataArray.map((_, rowIndex) => 
              `(${Object.keys(firstItem).map((_, colIndex) => 
                `$${rowIndex * Object.keys(firstItem).length + colIndex + 1}`
              ).join(', ')})`
            ).join(', ');
            
            // Flatten all values into a single array
            const values = dataArray.flatMap(item => Object.values(item));
            
            const result = await executeQuery(
              `INSERT INTO ${table} (${columns}) VALUES ${placeholders} RETURNING ${returnColumns}`,
              values
            );
            
            return { data: result.rows[0], error: null };
          } catch (error) {
            console.error('Error in supabase.from.insert.select.single:', error);
            return { data: null, error };
          }
        },
        execute: async () => {
          try {
            // Handle array of data or single object
            const dataArray = Array.isArray(data) ? data : [data];
            const firstItem = dataArray[0];
            
            const columns = Object.keys(firstItem).join(', ');
            const placeholders = dataArray.map((_, rowIndex) => 
              `(${Object.keys(firstItem).map((_, colIndex) => 
                `$${rowIndex * Object.keys(firstItem).length + colIndex + 1}`
              ).join(', ')})`
            ).join(', ');
            
            // Flatten all values into a single array
            const values = dataArray.flatMap(item => Object.values(item));
            
            const result = await executeQuery(
              `INSERT INTO ${table} (${columns}) VALUES ${placeholders} RETURNING ${returnColumns}`,
              values
            );
            
            return { data: result.rows, error: null };
          } catch (error) {
            console.error('Error in supabase.from.insert.select.execute:', error);
            return { data: null, error };
          }
        }
      }),
      error: null
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        execute: async () => {
          try {
            const setClause = Object.keys(data)
              .map((key, i) => `${key} = $${i + 1}`)
              .join(', ');
            
            const values = [...Object.values(data), value];
            
            const result = await executeQuery(
              `UPDATE ${table} SET ${setClause} WHERE ${column} = $${values.length} RETURNING *`,
              values
            );
            
            return { data: result.rows[0], error: null };
          } catch (error) {
            console.error('Error in supabase.from.update.eq.execute:', error);
            return { data: null, error };
          }
        },
        select: (returnColumns: string = '*') => ({
          single: async () => {
            try {
              const setClause = Object.keys(data)
                .map((key, i) => `${key} = $${i + 1}`)
                .join(', ');
              
              const values = [...Object.values(data), value];
              
              const result = await executeQuery(
                `UPDATE ${table} SET ${setClause} WHERE ${column} = $${values.length} RETURNING ${returnColumns}`,
                values
              );
              
              return { data: result.rows[0], error: null };
            } catch (error) {
              console.error('Error in supabase.from.update.eq.select.single:', error);
              return { data: null, error };
            }
          }
        }),
        error: null
      })
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        execute: async () => {
          try {
            const result = await executeQuery(
              `DELETE FROM ${table} WHERE ${column} = $1 RETURNING *`,
              [value]
            );
            
            return { data: result.rows[0], error: null };
          } catch (error) {
            console.error('Error in supabase.from.delete.eq.execute:', error);
            return { data: null, error };
          }
        },
        error: null
      })
    })
  }),
  
  // Storage methods (mock implementation)
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        console.log(`Mock storage: Uploading ${path} to ${bucket}`);
        return { data: { path }, error: null };
      },
      download: async (path: string) => {
        console.log(`Mock storage: Downloading ${path} from ${bucket}`);
        return { data: new Blob(), error: null };
      },
      getPublicUrl: (path: string) => {
        return { data: { publicUrl: `https://mock-storage.example.com/${bucket}/${path}` } };
      }
    })
  },
  
  // RPC methods (mock implementation)
  rpc: (functionName: string, params: any) => ({
    execute: async () => {
      console.log(`Mock RPC: Calling ${functionName} with params:`, params);
      return { data: null, error: null };
    }
  })
};

// Log initialization
console.log(`Supabase client initialized in ${isBrowser() ? 'browser' : 'Node.js'} environment`);
