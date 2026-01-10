"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronRight,
  Building2,
  Users,
  Heart,
  User,
  Upload,
  Check,
  Clock,
  Sparkles,
  Star,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { supabase } from "@/lib/supabase"

type OrgType = "registered" | "supported" | "informal" | "individual" | null
type ViewState = "category" | "form" | "success"

interface OrgSignupWizardProps {
  onBack?: () => void
}

const orgTypes = [
  {
    id: "registered" as const,
    title: "Registered Organisation",
    description: "NGO, Trust, or Society with legal registration",
    icon: Building2,
    color: "from-[#3b82f6] to-[#2563eb]",
    bgColor: "from-[#eff6ff] to-[#dbeafe]",
  },
  {
    id: "supported" as const,
    title: "Supported Organisation",
    description: "College club or corporate CSR team",
    icon: Users,
    color: "from-[#8b5cf6] to-[#7c3aed]",
    bgColor: "from-[#f5f3ff] to-[#ede9fe]",
  },
  {
    id: "informal" as const,
    title: "Informal Group",
    description: "Community group or friend circle",
    icon: Heart,
    color: "from-[#f59e0b] to-[#d97706]",
    bgColor: "from-[#fffbeb] to-[#fef3c7]",
  },
  {
    id: "individual" as const,
    title: "Individual Organizer",
    description: "Solo changemaker hosting events",
    icon: User,
    color: "from-[#10b981] to-[#059669]",
    bgColor: "from-[#f0fdf4] to-[#dcfce7]",
  },
]

export function OrgSignupWizard({ onBack }: OrgSignupWizardProps) {
  const [currentView, setCurrentView] = useState<ViewState>("category")
  const [selectedOrg, setSelectedOrg] = useState<OrgType>(null)
  const [registrationType, setRegistrationType] = useState<string>("ngo")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{
    registrationCertificate?: string;
    panCard?: string;
    proofDocument?: string;
  }>({});
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    // Validate required uploads based on org type
    if (selectedOrg === 'registered' && !uploadedFiles.registrationCertificate) {
      alert('Please upload Registration Certificate');
      return;
    }
    if (selectedOrg === 'supported' && !uploadedFiles.proofDocument) {
      alert('Please upload Proof of Organization');
      return;
    }
    if (selectedOrg === 'informal' && !uploadedFiles.proofDocument) {
      alert('Please upload Verification Proof');
      return;
    }

    try {
      const data: any = {
        orgType: selectedOrg,
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        phone: formData.get('phone') as string,
      };

      // Add conditional fields based on org type
      if (selectedOrg === 'registered') {
        data.registrationType = registrationType;
        data.registrationNumber = formData.get('registrationNumber') as string;
        data.representativeName = formData.get('representativeName') as string;
        data.designation = formData.get('designation') as string;
        data.website = formData.get('website') as string;
        data.registrationCertificateUrl = uploadedFiles.registrationCertificate;
        data.panCardUrl = uploadedFiles.panCard;
      } else if (selectedOrg === 'supported') {
        data.parentInstitution = formData.get('parentInstitution') as string;
        data.coordinatorName = formData.get('coordinatorName') as string;
        data.proofDocumentUrl = uploadedFiles.proofDocument;
      } else if (selectedOrg === 'informal') {
        data.areaLocality = formData.get('areaLocality') as string;
        data.proofDocumentUrl = uploadedFiles.proofDocument;
      } else if (selectedOrg === 'individual') {
        data.intentDescription = formData.get('intentDescription') as string;
      }

      await api.signupOrganization(data);
      setCurrentView('success');
    } catch (error: any) {
      alert(error.message || 'Signup failed. Please try again.');
    }
  };

  const handleFileUpload = async (
    file: File,
    fileType: 'registrationCertificate' | 'panCard' | 'proofDocument'
  ) => {
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF and image files (JPG, PNG) are allowed');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${selectedOrg}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('organization-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('organization-documents')
        .getPublicUrl(filePath);

      setUploadedFiles(prev => ({ ...prev, [fileType]: publicUrl }));
      alert('File uploaded successfully!');
    } catch (error: any) {
      alert(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Category Selection View
  if (currentView === "category") {
    return (
      <section className="min-h-screen bg-gradient-to-b from-[#fef7f0] via-white to-[#f0fdf4] relative overflow-x-hidden">
        {/* Header - only visible on mobile */}
        <header className="md:hidden pt-4 pb-3 text-center px-4">
          <Link href="/" className="inline-flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#ff6b6b] to-[#ee5a5a] flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="text-base font-semibold text-[#1d1d1f] tracking-tight">KINDLY</span>
          </Link>
        </header>

        <div className="absolute top-20 left-4 md:top-28 md:left-20 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white shadow-lg flex items-center justify-center z-10">
          <Building2 className="w-5 h-5 md:w-7 md:h-7 text-[#3b82f6]" />
        </div>
        <div className="absolute top-32 right-4 md:top-40 md:right-24 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white shadow-lg flex items-center justify-center z-10">
          <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-[#f59e0b]" />
        </div>
        <div className="hidden md:flex absolute bottom-40 left-32 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10">
          <Users className="w-7 h-7 text-[#8b5cf6]" />
        </div>
        <div className="hidden md:flex absolute bottom-32 right-40 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10">
          <Star className="w-7 h-7 text-[#10b981]" />
        </div>

        <div className="flex items-start md:items-center justify-center px-4 md:px-6 pt-2 md:pt-24 pb-8 md:pb-20">
          <div className="w-full max-w-90 md:max-w-125 relative">
            {/* Decorative blur elements */}
            <div className="absolute -top-8 -left-8 md:-top-10 md:-left-10 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-[#ffecd2]/40 to-[#fcb69f]/40 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -right-8 md:-bottom-10 md:-right-10 w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-[#a8edea]/40 to-[#fed6e3]/40 rounded-full blur-2xl" />

            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-5 md:p-10 shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)]">
              {/* Back button */}
              <button
                onClick={onBack}
                className="absolute top-4 left-4 md:top-6 md:left-6 text-[#86868b] hover:text-[#1d1d1f] transition-colors text-[12px] md:text-[13px] flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4 rotate-180" />
                Back
              </button>

              <h1 className="text-[20px] md:text-[32px] font-semibold text-[#1d1d1f] tracking-tight text-center mt-4 md:mt-0">
                What describes you best?
              </h1>
              <p className="text-[12px] md:text-[17px] text-[#86868b] text-center mt-1 md:mt-3 mb-4 md:mb-8">
                Select your organization type to continue
              </p>

              <div className="grid grid-cols-2 gap-2 md:gap-4">
                {orgTypes.map((org) => {
                  const Icon = org.icon
                  const isSelected = selectedOrg === org.id
                  return (
                    <button
                      key={org.id}
                      onClick={() => setSelectedOrg(org.id)}
                      className={cn(
                        "relative p-3 md:p-5 rounded-xl md:rounded-2xl text-left transition-all duration-300 border-2",
                        isSelected
                          ? "border-[#ff6b6b] bg-gradient-to-br from-[#fff5f5] to-[#ffe8e8] shadow-lg"
                          : "border-transparent bg-[#f5f5f7] hover:bg-[#ebebed]",
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 md:top-3 md:right-3 w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-r from-[#ff6b6b] to-[#ee5a5a] flex items-center justify-center">
                          <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-3 bg-gradient-to-br",
                          org.bgColor,
                        )}
                      >
                        <Icon
                          className="w-4 h-4 md:w-6 md:h-6"
                          style={{
                            color: org.color.includes("3b82f6")
                              ? "#3b82f6"
                              : org.color.includes("8b5cf6")
                                ? "#8b5cf6"
                                : org.color.includes("f59e0b")
                                  ? "#f59e0b"
                                  : "#10b981",
                          }}
                        />
                      </div>
                      <h3 className="text-[11px] md:text-[15px] font-semibold text-[#1d1d1f] mb-0.5 md:mb-1 leading-tight">
                        {org.title}
                      </h3>
                      <p className="text-[9px] md:text-[12px] text-[#86868b] leading-snug line-clamp-2">
                        {org.description}
                      </p>
                    </button>
                  )
                })}
              </div>

              <Button
                onClick={() => selectedOrg && setCurrentView("form")}
                disabled={!selectedOrg}
                className="w-full h-10 md:h-12 bg-gradient-to-r from-[#ff6b6b] to-[#ee5a5a] hover:from-[#ff5252] hover:to-[#e04848] text-white text-[13px] md:text-[17px] font-medium rounded-full mt-4 md:mt-6 disabled:opacity-50 shadow-lg shadow-[#ff6b6b]/25"
              >
                Continue
              </Button>

              <p className="text-center mt-4 md:mt-6 text-[10px] md:text-[13px] text-[#86868b]">
                Already registered?{" "}
                <Link href="/login" className="text-[#ff6b6b] hover:underline font-medium">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Success View
  if (currentView === "success") {
    return (
      <section className="min-h-screen bg-gradient-to-b from-[#fef7f0] via-white to-[#f0fdf4] flex flex-col items-center justify-center px-4 md:px-6 py-8 md:py-20 relative overflow-x-hidden">
        <div className="absolute top-16 left-4 md:top-24 md:left-24 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white shadow-lg flex items-center justify-center z-10">
          <Check className="w-5 h-5 md:w-7 md:h-7 text-[#10b981]" />
        </div>
        <div className="absolute top-24 right-4 md:top-32 md:right-28 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white shadow-lg flex items-center justify-center z-10">
          <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-[#f59e0b]" />
        </div>

        <div className="w-full max-w-85 md:max-w-110 relative">
          <div className="absolute -top-8 -left-8 md:-top-10 md:-left-10 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#ffecd2]/40 to-[#fcb69f]/40 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -right-8 md:-bottom-10 md:-right-10 w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-[#a8edea]/40 to-[#fed6e3]/40 rounded-full blur-2xl" />

          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-6 md:p-12 shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)] text-center">
            <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-gradient-to-br from-[#fef3c7] to-[#fde68a] flex items-center justify-center shadow-lg">
              <Clock className="w-8 h-8 md:w-12 md:h-12 text-[#f59e0b]" />
            </div>

            <h1 className="text-[22px] md:text-[32px] font-semibold text-[#1d1d1f] tracking-tight mb-2 md:mb-3">
              Application Submitted!
            </h1>
            <p className="text-[13px] md:text-[17px] text-[#86868b] mb-5 md:mb-8">
              We're reviewing your details. You'll hear from us within 24-48 hours.
            </p>

            <div className="bg-[#f5f5f7] rounded-xl md:rounded-2xl p-4 md:p-6 mb-5 md:mb-8">
              <div className="flex items-center justify-center gap-2 md:gap-3 mb-2 md:mb-3">
                <Shield className="w-4 h-4 md:w-5 md:h-5 text-[#3b82f6]" />
                <span className="text-[12px] md:text-[15px] font-medium text-[#1d1d1f]">Verification in Progress</span>
              </div>
              <p className="text-[10px] md:text-[13px] text-[#86868b]">
                Our team is verifying your documents and information to ensure a safe community.
              </p>
            </div>

            <Link href="/signup">
              <Button className="w-full h-10 md:h-12 bg-gradient-to-r from-[#ff6b6b] to-[#ee5a5a] hover:from-[#ff5252] hover:to-[#e04848] text-white text-[13px] md:text-[17px] font-medium rounded-full shadow-lg shadow-[#ff6b6b]/25">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  // Form View
  const selectedOrgData = orgTypes.find((o) => o.id === selectedOrg)

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#fef7f0] via-white to-[#f0fdf4] relative overflow-x-hidden">
      {/* Header - only visible on mobile */}
      <header className="md:hidden pt-4 pb-3 text-center px-4">
        <Link href="/" className="inline-flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#ff6b6b] to-[#ee5a5a] flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span className="text-base font-semibold text-[#1d1d1f] tracking-tight">KINDLY</span>
        </Link>
      </header>

      <div className="hidden md:flex absolute top-28 left-20 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10">
        {selectedOrgData && (
          <selectedOrgData.icon
            className="w-7 h-7"
            style={{
              color: selectedOrgData.color.includes("3b82f6")
                ? "#3b82f6"
                : selectedOrgData.color.includes("8b5cf6")
                  ? "#8b5cf6"
                  : selectedOrgData.color.includes("f59e0b")
                    ? "#f59e0b"
                    : "#10b981",
            }}
          />
        )}
      </div>
      <div className="hidden md:flex absolute top-40 right-24 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10">
        <Sparkles className="w-7 h-7 text-[#f59e0b]" />
      </div>
      <div className="hidden md:flex absolute bottom-32 right-40 w-14 h-14 rounded-2xl bg-white shadow-lg items-center justify-center z-10">
        <Star className="w-7 h-7 text-[#10b981]" />
      </div>

      <div className="flex items-start justify-center px-4 md:px-6 pt-2 md:pt-24 pb-8 md:pb-20">
        <div className="w-full max-w-90 md:max-w-125 relative">
          <div className="absolute -top-8 -left-8 md:-top-10 md:-left-10 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-[#ffecd2]/40 to-[#fcb69f]/40 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -right-8 md:-bottom-10 md:-right-10 w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-[#a8edea]/40 to-[#fed6e3]/40 rounded-full blur-2xl" />

          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-5 md:p-10 shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)]">
            {/* Back button */}
            <button
              onClick={() => setCurrentView("category")}
              className="absolute top-4 left-4 md:top-6 md:left-6 text-[#86868b] hover:text-[#1d1d1f] transition-colors text-[12px] md:text-[13px] flex items-center gap-1"
            >
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4 rotate-180" />
              Back
            </button>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-4 md:mb-6 mt-4 md:mt-0">
              <div className="w-6 md:w-8 h-1 md:h-1.5 rounded-full bg-gradient-to-r from-[#ff6b6b] to-[#ee5a5a]" />
              <div className="w-6 md:w-8 h-1 md:h-1.5 rounded-full bg-gradient-to-r from-[#ff6b6b] to-[#ee5a5a]" />
              <div className="w-6 md:w-8 h-1 md:h-1.5 rounded-full bg-[#e8e8ed]" />
            </div>

            <h1 className="text-[18px] md:text-[28px] font-semibold text-[#1d1d1f] tracking-tight text-center">
              {selectedOrgData?.title}
            </h1>
            <p className="text-[11px] md:text-[15px] text-[#86868b] text-center mt-1 md:mt-2 mb-4 md:mb-8">
              Tell us more about your organization
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-5">
              {selectedOrg === "registered" && (
                <>
                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Legal Organisation Name</Label>
                    <Input
                      name="name"
                      placeholder="Green Earth Foundation"

                      className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Email</Label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="contact@organisation.org"

                      className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Password</Label>
                    <div className="relative">
                      <Input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"

                        className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#3b82f6] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b]"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                          <Eye className="w-4 h-4 md:w-5 md:h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"

                        className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#3b82f6] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b]"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                          <Eye className="w-4 h-4 md:w-5 md:h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 md:space-y-3">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Registration Type</Label>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {["NGO", "Trust", "Society", "Section 8"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setRegistrationType(type.toLowerCase())}
                          className={cn(
                            "px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[11px] md:text-[14px] font-medium transition-all",
                            registrationType === type.toLowerCase()
                              ? "bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white shadow-md"
                              : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#ebebed]",
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Registration Number</Label>
                    <Input
                      name="registrationNumber"
                      placeholder="MH/2024/12345"

                      className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1 md:space-y-2">
                      <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Representative Name</Label>
                      <Input
                        name="representativeName"
                        placeholder="John Doe"

                        className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                      />
                    </div>
                    <div className="space-y-1 md:space-y-2">
                      <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Designation</Label>
                      <Input
                        name="designation"
                        placeholder="Director"

                        className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Phone Number</Label>
                    <div className="flex gap-1.5 md:gap-2">
                      <div className="h-10 md:h-14 px-3 md:px-4 bg-[#f5f5f7] rounded-lg md:rounded-xl flex items-center text-[#86868b] text-[12px] md:text-[15px] font-medium shrink-0">
                        +91
                      </div>
                      <Input
                        name="phone"
                        type="tel"
                        placeholder="9876543210"

                        pattern="[0-9]{10}"
                        className="flex-1 h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Website or Social Link</Label>
                    <Input
                      name="website"
                      placeholder="https://yourorganisation.org"
                      className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">
                      Upload Registration Certificate <span className="text-[#ef4444]">*</span>
                    </Label>
                    <div className="border-2 border-dashed border-[#d2d2d7] rounded-lg md:rounded-xl p-4 md:p-6 text-center bg-gradient-to-br from-[#eff6ff]/50 to-[#dbeafe]/50 hover:border-[#3b82f6] transition-colors cursor-pointer">
                      <input
                        type="file"
                        id="registrationCertificate"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'registrationCertificate');
                        }}
                        className="hidden"
                        disabled={uploading}
                      />
                      <label htmlFor="registrationCertificate" className="cursor-pointer">
                        {uploadedFiles.registrationCertificate ? (
                          <div className="text-[#10b981]">
                            <Check className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
                            <p className="text-[11px] md:text-[13px]">File uploaded successfully!</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-[#3b82f6]" />
                            <p className="text-[11px] md:text-[13px] text-[#86868b]">
                              {uploading ? 'Uploading...' : 'Click to upload PDF or image'}
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">
                      Upload PAN Card <span className="text-[#86868b]">(Optional)</span>
                    </Label>
                    <div className="border-2 border-dashed border-[#d2d2d7] rounded-lg md:rounded-xl p-3 md:p-4 text-center bg-[#f5f5f7]/50 hover:border-[#3b82f6] transition-colors cursor-pointer">
                      <input
                        type="file"
                        id="panCard"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'panCard');
                        }}
                        className="hidden"
                        disabled={uploading}
                      />
                      <label htmlFor="panCard" className="cursor-pointer">
                        {uploadedFiles.panCard ? (
                          <div className="text-[#10b981]">
                            <Check className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1" />
                            <p className="text-[10px] md:text-[12px]">Uploaded!</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 text-[#86868b]" />
                            <p className="text-[10px] md:text-[12px] text-[#86868b]">
                              {uploading ? 'Uploading...' : 'Click to upload'}
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </>
              )}

              {selectedOrg === "supported" && (
                <>
                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Club / Team Name</Label>
                    <Input
                      name="name"
                      placeholder="NSS Unit, ABC College"

                      className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Parent Institution</Label>
                    <Input
                      name="parentInstitution"
                      placeholder="ABC Engineering College"

                      className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Coordinator Name</Label>
                    <Input
                      name="coordinatorName"

                      placeholder="Prof. Sharma"
                      className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Coordinator Email</Label>
                    <Input
                      name="email"

                      type="email"
                      placeholder="coordinator@college.edu"
                      className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Password</Label>
                    <div className="relative">
                      <Input
                        name="password"

                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#8b5cf6] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b]"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                          <Eye className="w-4 h-4 md:w-5 md:h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        name="confirmPassword"

                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#8b5cf6] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b]"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                          <Eye className="w-4 h-4 md:w-5 md:h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">
                      Coordinator Phone Number
                    </Label>
                    <div className="flex gap-1.5 md:gap-2">
                      <div className="h-10 md:h-14 px-3 md:px-4 bg-[#f5f5f7] rounded-lg md:rounded-xl flex items-center text-[#86868b] text-[12px] md:text-[15px] font-medium shrink-0">
                        +91
                      </div>
                      <Input
                        name="phone"

                        type="tel"
                        placeholder="9876543210"
                        className="flex-1 h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">
                      Upload Proof of Organisation <span className="text-[#ef4444]">*</span>
                    </Label>
                    <div className="border-2 border-dashed border-[#d2d2d7] rounded-lg md:rounded-xl p-4 md:p-6 text-center bg-gradient-to-br from-[#f5f3ff]/50 to-[#ede9fe]/50 hover:border-[#8b5cf6] transition-colors cursor-pointer">
                      <input
                        type="file"
                        id="proofDocument"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'proofDocument');
                        }}
                        className="hidden"
                        disabled={uploading}
                      />
                      <label htmlFor="proofDocument" className="cursor-pointer">
                        {uploadedFiles.proofDocument ? (
                          <div className="text-[#10b981]">
                            <Check className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
                            <p className="text-[11px] md:text-[13px]">File uploaded successfully!</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-[#8b5cf6]" />
                            <p className="text-[11px] md:text-[13px] text-[#86868b]">
                              {uploading ? 'Uploading...' : 'College ID, Letter from Institution, etc.'}
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </>
              )}

              {selectedOrg === "informal" && (
                <div>
                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Group Name</Label>
                    <Input
                      name="name"

                      placeholder="Green Warriors Nashik"
                      className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#f59e0b]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Area / Locality</Label>
                    <Input
                      name="areaLocality"

                      placeholder="Nashik, Maharashtra"
                      className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#f59e0b]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">
                      Coordinator / Representative Name
                    </Label>
                    <Input
                      name="representativeName"

                      placeholder="Rahul Sharma"
                      className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#f59e0b]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Mobile Number</Label>
                    <div className="flex gap-1.5 md:gap-2">
                      <div className="h-10 md:h-14 px-3 md:px-4 bg-[#f5f5f7] rounded-lg md:rounded-xl flex items-center text-[#86868b] text-[12px] md:text-[15px] font-medium shrink-0">
                        +91
                      </div>
                      <Input
                        name="phone"

                        type="tel"
                        placeholder="9876543210"
                        className="flex-1 h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#f59e0b]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Email</Label>
                    <Input
                      name="email"

                      type="email"
                      placeholder="contact@group.com"
                      className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#f59e0b]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Password</Label>
                    <div className="relative">
                      <Input
                        name="password"

                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#f59e0b] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b]"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                          <Eye className="w-4 h-4 md:w-5 md:h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        name="confirmPassword"

                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#f59e0b] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b]"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                          <Eye className="w-4 h-4 md:w-5 md:h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">
                      Upload Verification Proof <span className="text-[#ef4444]">*</span>
                    </Label>
                    <div className="border-2 border-dashed border-[#d2d2d7] rounded-lg md:rounded-xl p-4 md:p-6 text-center bg-gradient-to-br from-[#f5f3ff]/50 to-[#ede9fe]/50 hover:border-[#8b5cf6] transition-colors cursor-pointer">
                      <input
                        type="file"
                        id="proofDocument"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'proofDocument');
                        }}
                        className="hidden"
                        disabled={uploading}
                      />
                      <label htmlFor="proofDocument" className="cursor-pointer">
                        {uploadedFiles.proofDocument ? (
                          <div className="text-[#10b981]">
                            <Check className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
                            <p className="text-[11px] md:text-[13px]">File uploaded successfully!</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-[#8b5cf6]" />
                            <p className="text-[11px] md:text-[13px] text-[#86868b]">
                              {uploading ? 'Uploading...' : 'Social media URL, certificate, etc.'}
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-[#d2d2d7] rounded-lg md:rounded-xl p-4 md:p-6 text-center bg-gradient-to-br from-[#fffbeb]/50 to-[#fef3c7]/50 hover:border-[#f59e0b] transition-colors cursor-pointer">
                    <Upload className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-[#f59e0b]" />
                    <p className="text-[11px] md:text-[13px] text-[#86868b]">
                      Social media URL, certificate, or any proof
                    </p>
                  </div>
                </div>
              )}

              {selectedOrg === "individual" && (
                <>
                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Full Name</Label>
                    <Input
                      name="name"

                      placeholder="Rajesh Kumar"
                      className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#10b981]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Email</Label>
                    <Input
                      type="email"
                      name="email"

                      placeholder="rajesh@email.com"
                      className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#10b981]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Phone Number</Label>
                    <div className="flex gap-1.5 md:gap-2">
                      <div className="h-10 md:h-14 px-3 md:px-4 bg-[#f5f5f7] rounded-lg md:rounded-xl flex items-center text-[#86868b] text-[12px] md:text-[15px] font-medium shrink-0">
                        +91
                      </div>
                      <Input
                        name="phone"

                        type="tel"
                        placeholder="9876543210"
                        className="flex-1 h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#10b981]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Password</Label>
                    <div className="relative">
                      <Input
                        name="password"

                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#10b981] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b]"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                          <Eye className="w-4 h-4 md:w-5 md:h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        name="confirmPassword"

                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className="h-10 md:h-14 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#10b981] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b]"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                          <Eye className="w-4 h-4 md:w-5 md:h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-[#86868b] font-normal">
                      Why do you want to join? <span className="text-[#ef4444]">*</span>
                    </Label>
                    <Textarea
                      placeholder="Tell us about your intent - what type of events you want to create, your passion for volunteering, etc."
                      className="min-h-25 md:min-h-30 bg-[#f5f5f7] border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] focus-visible:ring-2 focus-visible:ring-[#10b981] resize-none"
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full h-10 md:h-12 bg-gradient-to-r from-[#ff6b6b] to-[#ee5a5a] hover:from-[#ff5252] hover:to-[#e04848] text-white text-[13px] md:text-[17px] font-medium rounded-full mt-3 md:mt-6 shadow-lg shadow-[#ff6b6b]/25"
              >
                Submit Application
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section >
  )
}
