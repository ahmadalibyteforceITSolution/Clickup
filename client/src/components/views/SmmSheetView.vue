<template>
  <div class="h-full flex flex-col bg-slate-50 dark:bg-[#18191B] overflow-hidden">
    <!-- Top Stats & Header Bar -->
    <div class="p-6 border-b border-slate-200 dark:border-[#2F3136] bg-white dark:bg-[#202225] shrink-0 space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <Share2 class="w-5 h-5" />
            </div>
            <div>
              <h1 class="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <span>SMM & Campaign Sheet</span>
                <span class="text-xs px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold rounded-full">
                  {{ smmStore.filteredCampaigns.length }} Links
                </span>
              </h1>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Track social media links, marketing campaign budgets, clicks, and export/import sheets via CSV
              </p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Download Sample Template -->
          <button
            @click="smmStore.downloadSampleTemplate()"
            class="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#292B2F] border border-slate-200 dark:border-[#2F3136] rounded-xl flex items-center space-x-1.5 transition-colors"
            title="Download Sample CSV Template"
          >
            <FileSpreadsheet class="w-4 h-4 text-emerald-500" />
            <span class="hidden sm:inline">Sample CSV</span>
          </button>

          <!-- Export CSV -->
          <button
            @click="smmStore.exportCsvFile()"
            class="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#18191B] hover:bg-slate-50 dark:hover:bg-[#292B2F] border border-slate-200 dark:border-[#2F3136] rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Download class="w-4 h-4 text-purple-500" />
            <span>Export CSV</span>
          </button>

          <!-- Upload CSV -->
          <button
            v-if="authStore.isSuperAdmin || authStore.isManager"
            @click="openUploadModal"
            class="px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <UploadCloud class="w-4 h-4 text-pink-400" />
            <span>Upload CSV</span>
          </button>

          <!-- + Add Campaign Link -->
          <button
            v-if="authStore.isSuperAdmin || authStore.isManager"
            @click="openCreateModal"
            class="px-4 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl flex items-center space-x-1.5 shadow-md shadow-purple-500/20 transition-all active:scale-95"
          >
            <Plus class="w-4 h-4" />
            <span>+ Add Campaign Link</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div class="p-3 bg-slate-50 dark:bg-[#18191B] rounded-2xl border border-slate-100 dark:border-[#2F3136]">
          <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Campaigns</span>
          <p class="text-base font-black text-slate-900 dark:text-white mt-0.5">{{ smmStore.campaigns.length }}</p>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-[#18191B] rounded-2xl border border-slate-100 dark:border-[#2F3136]">
          <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Budget</span>
          <p class="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">${{ smmStore.totalBudget.toLocaleString() }}</p>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-[#18191B] rounded-2xl border border-slate-100 dark:border-[#2F3136]">
          <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Clicks</span>
          <p class="text-base font-black text-purple-600 dark:text-purple-400 mt-0.5">{{ smmStore.totalClicks.toLocaleString() }}</p>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-[#18191B] rounded-2xl border border-slate-100 dark:border-[#2F3136]">
          <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Impressions</span>
          <p class="text-base font-black text-pink-600 dark:text-pink-400 mt-0.5">{{ smmStore.totalImpressions.toLocaleString() }}</p>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
        <!-- Search -->
        <div class="relative flex-1 min-w-[240px] max-w-md">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            v-model="smmStore.searchQuery"
            type="text"
            placeholder="Search campaigns, links, audience, notes..."
            class="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <!-- Platform & Status Dropdowns -->
        <div class="flex items-center space-x-2">
          <!-- Platform Filter -->
          <select
            v-model="smmStore.selectedPlatform"
            class="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">🌐 All Platforms</option>
            <option value="instagram">📸 Instagram</option>
            <option value="facebook">📘 Facebook</option>
            <option value="tiktok">🎵 TikTok</option>
            <option value="linkedin">💼 LinkedIn</option>
            <option value="youtube">📺 YouTube</option>
            <option value="twitter">🐦 Twitter / X</option>
            <option value="pinterest">📌 Pinterest</option>
            <option value="google_ads">🎯 Google Ads</option>
            <option value="other">🔗 Other Links</option>
          </select>

          <!-- Status Filter -->
          <select
            v-model="smmStore.selectedStatus"
            class="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">⚡ All Statuses</option>
            <option value="active">🟢 Active</option>
            <option value="scheduled">🟡 Scheduled</option>
            <option value="completed">🔵 Completed</option>
            <option value="paused">⚪ Paused</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Data Sheet Table -->
    <div class="flex-1 overflow-auto p-6">
      <div class="bg-white dark:bg-[#202225] rounded-3xl border border-slate-200 dark:border-[#2F3136] shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50/80 dark:bg-[#18191B]/80 text-slate-400 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-[#2F3136]">
              <th class="py-3.5 px-4">Platform</th>
              <th class="py-3.5 px-4">Campaign Name</th>
              <th class="py-3.5 px-4">Campaign / Social URL</th>
              <th class="py-3.5 px-3">Status</th>
              <th class="py-3.5 px-3 text-right">Budget</th>
              <th class="py-3.5 px-3 text-right">Clicks</th>
              <th class="py-3.5 px-3 text-right">Impressions</th>
              <th class="py-3.5 px-4">Target Audience</th>
              <th class="py-3.5 px-4">Notes</th>
              <th v-if="authStore.isSuperAdmin || authStore.isManager" class="py-3.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-[#2F3136]">
            <tr
              v-for="c in smmStore.filteredCampaigns"
              :key="c._id || c.id"
              class="hover:bg-slate-50/80 dark:hover:bg-[#18191B]/50 transition-colors group"
            >
              <!-- Platform -->
              <td class="py-3 px-4 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                  <span
                    class="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-xs"
                    :class="getPlatformBadge(c.platform).bg"
                  >
                    {{ getPlatformBadge(c.platform).icon }}
                  </span>
                  <span class="font-bold text-slate-800 dark:text-slate-200 capitalize">
                    {{ c.platform?.replace('_', ' ') }}
                  </span>
                </div>
              </td>

              <!-- Campaign Name -->
              <td class="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                {{ c.campaignName }}
              </td>

              <!-- URL / Social Link -->
              <td class="py-3 px-4 max-w-xs">
                <a
                  :href="c.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1 truncate font-medium"
                >
                  <span class="truncate">{{ c.url }}</span>
                  <ExternalLink class="w-3.5 h-3.5 shrink-0 ml-1 opacity-70" />
                </a>
              </td>

              <!-- Status -->
              <td class="py-3 px-3 whitespace-nowrap">
                <span
                  class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide"
                  :class="getStatusBadge(c.status)"
                >
                  {{ c.status }}
                </span>
              </td>

              <!-- Budget -->
              <td class="py-3 px-3 text-right font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">
                ${{ (c.budget || 0).toLocaleString() }}
              </td>

              <!-- Clicks -->
              <td class="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {{ (c.clicks || 0).toLocaleString() }}
              </td>

              <!-- Impressions -->
              <td class="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {{ (c.impressions || 0).toLocaleString() }}
              </td>

              <!-- Target Audience -->
              <td class="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                {{ c.targetAudience || '—' }}
              </td>

              <!-- Notes -->
              <td class="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                {{ c.notes || '—' }}
              </td>

              <!-- Actions -->
              <td v-if="authStore.isSuperAdmin || authStore.isManager" class="py-3 px-4 text-center whitespace-nowrap">
                <div class="flex items-center justify-center space-x-1.5">
                  <button
                    @click="openEditModal(c)"
                    class="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors"
                    title="Edit Campaign"
                  >
                    <Edit3 class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleDelete(c)"
                    class="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                    title="Delete Campaign"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="smmStore.filteredCampaigns.length === 0">
              <td colspan="10" class="py-12 text-center text-slate-400">
                <div class="flex flex-col items-center justify-center space-y-2">
                  <Share2 class="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  <p class="text-xs font-bold text-slate-600 dark:text-slate-300">No campaigns or social links found</p>
                  <p class="text-[11px] text-slate-400">Upload a CSV file or add campaign links to populate this sheet.</p>
                  <div class="flex items-center space-x-2 pt-2">
                    <button
                      v-if="authStore.isSuperAdmin || authStore.isManager"
                      @click="openUploadModal"
                      class="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-800 rounded-xl"
                    >
                      Upload CSV
                    </button>
                    <button
                      v-if="authStore.isSuperAdmin || authStore.isManager"
                      @click="openCreateModal"
                      class="px-3.5 py-1.5 text-xs font-bold text-white bg-purple-600 rounded-xl"
                    >
                      + Add Link
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- CREATE / EDIT MODAL -->
    <div
      v-if="campaignModalOpen"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      @click.self="campaignModalOpen = false"
    >
      <div class="bg-white dark:bg-[#202225] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#2F3136] w-full max-w-lg overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b border-slate-100 dark:border-[#2F3136] flex items-center justify-between bg-slate-50/50 dark:bg-[#18191B]/50">
          <h3 class="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Share2 class="w-4 h-4 text-purple-600" />
            <span>{{ isEditing ? 'Edit Campaign Link' : 'Add New Campaign Link' }}</span>
          </h3>
          <button @click="campaignModalOpen = false" class="text-slate-400 hover:text-slate-600">
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleSaveCampaign" class="p-6 space-y-3.5 text-xs">
          <div>
            <label class="block font-bold text-slate-500 uppercase text-[11px] mb-1">Campaign Name *</label>
            <input
              v-model="form.campaignName"
              type="text"
              required
              placeholder="e.g. Summer Promo, Black Friday Story Tag..."
              class="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-500 uppercase text-[11px] mb-1">Platform *</label>
              <select
                v-model="form.platform"
                required
                class="w-full px-3 py-2 bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="instagram">📸 Instagram</option>
                <option value="facebook">📘 Facebook</option>
                <option value="tiktok">🎵 TikTok</option>
                <option value="linkedin">💼 LinkedIn</option>
                <option value="youtube">📺 YouTube</option>
                <option value="twitter">🐦 Twitter / X</option>
                <option value="pinterest">📌 Pinterest</option>
                <option value="google_ads">🎯 Google Ads</option>
                <option value="other">🔗 Other Link</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-500 uppercase text-[11px] mb-1">Status</label>
              <select
                v-model="form.status"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="active">🟢 Active</option>
                <option value="scheduled">🟡 Scheduled</option>
                <option value="completed">🔵 Completed</option>
                <option value="paused">⚪ Paused</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-500 uppercase text-[11px] mb-1">Campaign Link / URL *</label>
            <input
              v-model="form.url"
              type="url"
              required
              placeholder="https://instagram.com/p/... or https://ads.facebook.com/..."
              class="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] focus:border-purple-500 rounded-xl text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block font-bold text-slate-500 uppercase text-[11px] mb-1">Budget ($)</label>
              <input
                v-model="form.budget"
                type="number"
                min="0"
                step="10"
                placeholder="500"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-500 uppercase text-[11px] mb-1">Clicks</label>
              <input
                v-model="form.clicks"
                type="number"
                min="0"
                placeholder="1200"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-500 uppercase text-[11px] mb-1">Impressions</label>
              <input
                v-model="form.impressions"
                type="number"
                min="0"
                placeholder="45000"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-500 uppercase text-[11px] mb-1">Target Audience / Category</label>
            <input
              v-model="form.targetAudience"
              type="text"
              placeholder="e.g. US Tech Buyers 25-45, Fashion Gen Z..."
              class="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-500 uppercase text-[11px] mb-1">Notes / Campaign Strategy</label>
            <textarea
              v-model="form.notes"
              rows="2"
              placeholder="Add targeting notes, influencer tags, or goal notes..."
              class="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18191B] border border-slate-200 dark:border-[#2F3136] rounded-xl text-slate-900 dark:text-white focus:outline-none"
            ></textarea>
          </div>

          <div class="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-[#2F3136]">
            <button
              type="button"
              @click="campaignModalOpen = false"
              class="px-4 py-2 font-semibold text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-500/20 transition-all active:scale-95"
            >
              {{ isEditing ? 'Save Changes' : 'Add to Sheet' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- CSV UPLOAD MODAL -->
    <div
      v-if="uploadModalOpen"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      @click.self="uploadModalOpen = false"
    >
      <div class="bg-white dark:bg-[#202225] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#2F3136] w-full max-w-md overflow-hidden p-6 space-y-4 text-slate-900 dark:text-white">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-extrabold flex items-center space-x-2">
            <UploadCloud class="w-5 h-5 text-pink-500" />
            <span>Upload SMM CSV Sheet</span>
          </h3>
          <button @click="uploadModalOpen = false" class="text-slate-400 hover:text-slate-600">
            <X class="w-4 h-4" />
          </button>
        </div>

        <p class="text-xs text-slate-500 dark:text-slate-400">
          Upload any `.csv` file exported from Excel, Google Sheets, or Facebook/Instagram Ads manager.
        </p>

        <!-- Dropzone -->
        <div
          class="border-2 border-dashed border-slate-300 dark:border-[#2F3136] hover:border-purple-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-[#18191B]/50"
          @click="triggerCsvInput"
        >
          <input
            type="file"
            ref="csvFileInputRef"
            accept=".csv"
            @change="handleCsvFileSelected"
            class="hidden"
          />
          <FileSpreadsheet class="w-10 h-10 text-purple-500 mx-auto mb-2" />
          <p v-if="!selectedCsvFile" class="text-xs font-bold text-slate-700 dark:text-slate-200">
            Click to select or drop .csv file here
          </p>
          <p v-else class="text-xs font-extrabold text-purple-600 dark:text-purple-400 truncate">
            📄 {{ selectedCsvFile.name }} ({{ Math.round(selectedCsvFile.size / 1024) }} KB)
          </p>
          <p class="text-[10px] text-slate-400 mt-1">Supports standard CSV with Campaign Name and Links</p>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#2F3136]">
          <button
            @click="smmStore.downloadSampleTemplate()"
            class="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline"
          >
            Download Template
          </button>
          <div class="flex items-center space-x-2">
            <button
              @click="uploadModalOpen = false"
              class="px-3.5 py-1.5 text-xs font-semibold text-slate-500"
            >
              Cancel
            </button>
            <button
              @click="handleImportCsv"
              :disabled="!selectedCsvFile || importing"
              class="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              {{ importing ? 'Importing Rows...' : 'Import to Sheet' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { 
  Share2, Plus, Download, UploadCloud, FileSpreadsheet, Search, ExternalLink, Edit3, Trash2, X 
} from 'lucide-vue-next';
import { useSmmStore } from '@/stores/smmStore';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

const smmStore = useSmmStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

const campaignModalOpen = ref(false);
const isEditing = ref(false);
const editingId = ref(null);

const uploadModalOpen = ref(false);
const csvFileInputRef = ref(null);
const selectedCsvFile = ref(null);
const importing = ref(false);

const form = reactive({
  campaignName: '',
  platform: 'instagram',
  url: '',
  status: 'active',
  budget: 0,
  clicks: 0,
  impressions: 0,
  targetAudience: '',
  notes: ''
});

onMounted(async () => {
  await smmStore.fetchCampaigns();
});

function getPlatformBadge(platform) {
  switch (platform) {
    case 'instagram':
      return { icon: '📸', bg: 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600' };
    case 'facebook':
      return { icon: '📘', bg: 'bg-blue-600' };
    case 'tiktok':
      return { icon: '🎵', bg: 'bg-black dark:bg-slate-800' };
    case 'linkedin':
      return { icon: '💼', bg: 'bg-sky-700' };
    case 'youtube':
      return { icon: '📺', bg: 'bg-red-600' };
    case 'twitter':
      return { icon: '🐦', bg: 'bg-slate-900' };
    case 'pinterest':
      return { icon: '📌', bg: 'bg-red-700' };
    case 'google_ads':
      return { icon: '🎯', bg: 'bg-emerald-600' };
    default:
      return { icon: '🔗', bg: 'bg-purple-600' };
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
    case 'scheduled':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
    case 'completed':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
    case 'paused':
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  }
}

function openCreateModal() {
  isEditing.value = false;
  editingId.value = null;
  form.campaignName = '';
  form.platform = 'instagram';
  form.url = '';
  form.status = 'active';
  form.budget = 0;
  form.clicks = 0;
  form.impressions = 0;
  form.targetAudience = '';
  form.notes = '';
  campaignModalOpen.value = true;
}

function openEditModal(campaign) {
  isEditing.value = true;
  editingId.value = campaign._id || campaign.id;
  form.campaignName = campaign.campaignName || '';
  form.platform = campaign.platform || 'other';
  form.url = campaign.url || '';
  form.status = campaign.status || 'active';
  form.budget = campaign.budget || 0;
  form.clicks = campaign.clicks || 0;
  form.impressions = campaign.impressions || 0;
  form.targetAudience = campaign.targetAudience || '';
  form.notes = campaign.notes || '';
  campaignModalOpen.value = true;
}

async function handleSaveCampaign() {
  if (!form.campaignName.trim() || !form.url.trim()) return;

  if (isEditing.value && editingId.value) {
    await smmStore.updateCampaign(editingId.value, { ...form });
  } else {
    await smmStore.createCampaign({ ...form });
  }
  campaignModalOpen.value = false;
}

async function handleDelete(campaign) {
  const confirmed = await uiStore.confirm({
    title: 'Delete Campaign Link',
    message: `Are you sure you want to remove "${campaign.campaignName}" from this SMM sheet?`,
    confirmText: 'Delete Link',
    isDanger: true
  });

  if (confirmed) {
    await smmStore.deleteCampaign(campaign._id || campaign.id);
  }
}

function openUploadModal() {
  selectedCsvFile.value = null;
  uploadModalOpen.value = true;
}

function triggerCsvInput() {
  csvFileInputRef.value?.click();
}

function handleCsvFileSelected(e) {
  const file = e.target.files[0];
  if (file) {
    selectedCsvFile.value = file;
  }
}

async function handleImportCsv() {
  if (!selectedCsvFile.value) return;
  importing.value = true;
  try {
    await smmStore.importCsvFile(selectedCsvFile.value);
    uploadModalOpen.value = false;
  } catch (err) {
    // Error is handled in uiStore
  } finally {
    importing.value = false;
  }
}
</script>
