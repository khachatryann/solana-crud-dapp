'use client'

import { PublicKey } from '@solana/web3.js'
import { useCrudappProgram, useCrudappProgramAccount } from './crudapp-data-access'
import { useMemo, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

export function CrudappCreate() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const { createEntry, accounts } = useCrudappProgram()
  const { publicKey } = useWallet();

  const isFormValid = title.trim() != '' && message.trim() != '';

  const handleSubmit = async () => {
    if (publicKey && isFormValid) {
      await createEntry.mutateAsync({ title, message, owner: publicKey });
      // Clear the input fields after successful creation
      setTitle('');
      setMessage('');
      // Refresh the list
      accounts.refetch();
    }
  }

  if (!publicKey) {
    return <p>Connect Your Wallet.</p>
  }

  return (
    <div className='flex flex-col items-center gap-6 p-7 md:flex-row rounded-2xl'>
      <input 
        type='text'
        placeholder='Title'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className='input input-bordered w-full max-w-xs'  
      />
      <textarea
        placeholder='Message'
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className='textarea textarea-bordered w-full max-w-xs'
      />
      <button 
        onClick={handleSubmit}
        className='btn btn-xs lg:btn-md btn-primary'
        disabled={createEntry.isPending || !isFormValid}
      >
        Create
      </button>
    </div>
  )
}

export function CrudappList() {
  const { accounts, getProgramAccount } = useCrudappProgram()

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }
  return (
    <div className={'space-y-4'}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account) => (
            <CrudappCard 
              key={account.publicKey.toString()} 
              account={account.publicKey} 
              refreshAccounts={() => accounts.refetch()}
            />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  )
}

function CrudappCard({ account, refreshAccounts }: { account: PublicKey, refreshAccounts: () => void }) {
  const { 
    accountQuery, updateEntry, deleteEntry
  } = useCrudappProgramAccount({account})

  const { publicKey } = useWallet();

  const [message, setMessage] = useState("");
  const title = accountQuery.data?.string;
  const isFormValid = message.trim() != '';

  const handleUpdate = async () => {
    if (publicKey && isFormValid && title) {
      try {
        await updateEntry.mutateAsync({ title, message, owner: publicKey });
        // Clear the message input after successful update
        setMessage("");
        // Refresh the account data to show updated message
        accountQuery.refetch();
        // Refresh the accounts list to make sure any changes are reflected
        refreshAccounts();
      } catch (error) {
        console.error("Error updating entry:", error);
      }
    }
  }

  const handleDelete = async () => {
    const title = accountQuery.data?.string;
    if (title) {
      try {
        await deleteEntry.mutateAsync(title);
        // Refresh the accounts list after successful deletion
        refreshAccounts();
      } catch (error) {
        console.error("Error deleting entry:", error);
      }
    }
  }

  if (!publicKey) {
    return <p>Connect Your Wallet.</p>
  }

  return accountQuery.isLoading ? (
    <span className='loading loading-spinner loading-lg'></span> ) : (
      <div className='card card-bordered bordered-base-300 border-4 text-neutral-content'>
        <div className='card-body items-center text-center'>
          <div className="space-y-6">
          <h2 className='card-title justify-center text-3xl cursor-pointer'
            onClick={() => accountQuery.refetch()}>
            {accountQuery.data?.string}
          </h2>
          <p>{accountQuery.data?.message}</p>
          <div className='card-actions justfiy-around'>
            <textarea
              placeholder='Message'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className='textarea textarea-bordered w-full max-w-xs'
            />
            <button 
              onClick={handleUpdate}
              disabled={updateEntry.isPending || !isFormValid}
              className='btn btn-xs lg:btn-md btn-primary'
            >
              Update Journal Entry
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteEntry.isPending}
              className='btn btn-xs lg:btn-md btn-error'
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}