import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabaseAuctionService } from '../services/supabaseService';
import { validatePreAuctionUpload, normalizePreAuctionRows } from '../utils/preAuctionRules';
import toast from 'react-hot-toast';

const ExcelUpload = ({ onDataLoaded, mode = 'players' }) => {
  const isPreAuction = mode === 'preauction';
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const processExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get sheet names
          const sheetNames = workbook.SheetNames;
          console.log('Available sheets:', sheetNames);

          // Load Players sheet
          let playersSheet;
          if (sheetNames.includes('Players')) {
            playersSheet = 'Players';
          } else if (sheetNames.length > 0) {
            playersSheet = sheetNames[0];
            console.warn(`Using first sheet '${playersSheet}' for Players data`);
          } else {
            throw new Error('No sheets found in Excel file');
          }

          // Load Teams sheet
          let teamsSheet;
          if (sheetNames.includes('Teams')) {
            teamsSheet = 'Teams';
          } else if (sheetNames.length > 1) {
            teamsSheet = sheetNames[1];
            console.warn(`Using second sheet '${teamsSheet}' for Teams data`);
          } else {
            throw new Error('Excel file must have at least 2 sheets (Players and Teams)');
          }

          // Convert sheets to JSON
          const playersData = XLSX.utils.sheet_to_json(workbook.Sheets[playersSheet]);
          const teamsData = XLSX.utils.sheet_to_json(workbook.Sheets[teamsSheet]);

          // Validate required columns
          const requiredPlayerCols = ['PlayerID', 'Name', 'Role', 'BaseTokens'];
          const requiredTeamCols = ['TeamID', 'TeamName', 'LogoFile'];

          const playerCols = Object.keys(playersData[0] || {});
          const teamCols = Object.keys(teamsData[0] || {});

          const missingPlayerCols = requiredPlayerCols.filter(col => !playerCols.includes(col));
          const missingTeamCols = requiredTeamCols.filter(col => !teamCols.includes(col));

          if (missingPlayerCols.length > 0) {
            throw new Error(`Missing required columns in Players sheet: ${missingPlayerCols.join(', ')}`);
          }

          if (missingTeamCols.length > 0) {
            throw new Error(`Missing required columns in Teams sheet: ${missingTeamCols.join(', ')}`);
          }

          resolve({ players: playersData, teams: teamsData });

        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const processPreAuctionFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });

          if (!workbook.SheetNames.includes('Teams')) {
            throw new Error("Workbook must contain a sheet named 'Teams'.");
          }
          if (!workbook.SheetNames.includes('PreAuction')) {
            throw new Error("Workbook must contain a sheet named 'PreAuction'.");
          }

          const teamRows = XLSX.utils.sheet_to_json(workbook.Sheets['Teams']);
          const playerRows = XLSX.utils.sheet_to_json(workbook.Sheets['PreAuction']);

          resolve({ teamRows, playerRows });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handlePreAuctionUpload = async (file) => {
    setUploading(true);
    const uploadToast = toast.loading('Reading pre-auction workbook...');

    try {
      const { teamRows, playerRows } = await processPreAuctionFile(file);

      const { valid, errors, warnings } = validatePreAuctionUpload(teamRows, playerRows);

      if (!valid) {
        // Nothing is written when validation fails — a partial write would
        // leave some teams locked and others not.
        toast.dismiss(uploadToast);
        setValidationErrors(errors);
        toast.error(`${errors.length} problem(s) found. Nothing was uploaded.`, { duration: 6000 });
        return;
      }

      setValidationErrors([]);
      toast.loading('Uploading pre-auction squads...', { id: uploadToast });

      const result = await supabaseAuctionService.uploadPreAuctionSquads(
        teamRows,
        normalizePreAuctionRows(playerRows)
      );

      if (!result.success) throw new Error(result.error);

      toast.success(result.message, { id: uploadToast, duration: 4000 });

      warnings.forEach(w => toast(w, { icon: '⚠️', duration: 6000 }));

      if (onDataLoaded) onDataLoaded();
    } catch (error) {
      console.error('Error uploading pre-auction file:', error);
      toast.error(`Upload failed: ${error.message}`, { id: uploadToast });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    if (isPreAuction) {
      await handlePreAuctionUpload(file);
      return;
    }

    setUploading(true);
    const uploadToast = toast.loading('Processing Excel file...');

    try {
      // Process Excel file
      const { players, teams } = await processExcelFile(file);
      
      toast.loading('Uploading to Supabase...', { id: uploadToast });

      // Upload directly to Supabase
      const result = await supabaseAuctionService.uploadExcelData(players, teams);

      if (result.success) {
        toast.success(result.message, { id: uploadToast, duration: 4000 });
        
        // Reload data from Supabase
        if (onDataLoaded) {
          onDataLoaded();
        }
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Error uploading Excel file:', error);
      toast.error(`Failed to process Excel file: ${error.message}`, { id: uploadToast });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          dragActive
            ? 'border-teal-500 bg-teal-50'
            : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center space-y-4">
          {uploading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          ) : (
            <FileSpreadsheet size={48} className="text-teal-600" />
          )}
          
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {uploading
                ? 'Processing Excel File...'
                : isPreAuction ? 'Upload Pre-Auction Squads' : 'Upload Excel Data'}
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop your Excel file here, or click to browse
            </p>
            
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id="excel-upload"
            />
            
            <label
              htmlFor="excel-upload"
              className={`inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors cursor-pointer ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload size={20} />
              Choose Excel File
            </label>
          </div>
        </div>
      </div>

      {/* Validation errors — pre-auction mode only */}
      {validationErrors.length > 0 && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
            <AlertCircle size={16} />
            {validationErrors.length} problem(s) — nothing was uploaded
          </h4>
          <ul className="text-sm text-red-700 space-y-1 max-h-64 overflow-y-auto list-disc list-inside">
            {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      {/* File Requirements */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <AlertCircle size={16} />
          Excel File Requirements
        </h4>
        {isPreAuction ? (
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Sheet "Teams":</strong> TeamID, TeamName, LogoFile</p>
            <p><strong>Sheet "PreAuction":</strong> TeamName, PlayerID, Name, Role, BaseTokens, PreAuctionRole, Availability (optional), PhotoFileName (optional), Department (optional)</p>
            <p><strong>PreAuctionRole:</strong> Captain, ViceCaptain, Squad — exactly 1 Captain, 1 ViceCaptain and 3 Squad per team</p>
            <p><strong>Supported Roles:</strong> Batsman, Bowler, All-rounder, WicketKeeper</p>
            <p><strong>Note:</strong> The whole workbook is validated before anything is written. These five players cost no coins.</p>
            <p>Generate a blank template with <code>node scripts/create_pre_auction_template.js</code></p>
          </div>
        ) : (
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Sheet 1 - Players:</strong> PlayerID, Name, Role, BaseTokens, PhotoFileName (optional), Department (optional)</p>
            <p><strong>Sheet 2 - Teams:</strong> TeamID, TeamName, LogoFile (optional)</p>
            <p><strong>Supported Roles:</strong> Batsman, Bowler, All-rounder, WicketKeeper</p>
            <p><strong>Note:</strong> Players already locked in as pre-auction picks are never overwritten</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelUpload;