// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { Eye, EyeOff } from 'lucide-react';

// const SignUp = () => {
//   // Basic form fields
//   const [formData, setFormData] = useState({
//     username: '',
//     email: '',
//     firstName: '',
//     lastName: '',
//     password: '',
//     confirmPassword: '',
//   });

//   // Error states
//   const [errors, setErrors] = useState({
//     username: '',
//     email: '',
//     firstName: '',
//     lastName: '',
//     password: '',
//     confirmPassword: '',
//   });

//   // UI and submission states
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const navigate = useNavigate();
//   const { signup, error } = useAuth();

//   // Generic input change handler
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));

//     // Validate specific field
//     // validateField(name, value);
//   };

//   // Validation methods
//   const validateField = (name, value) => {
//     switch(name) {
//       case 'username':
//         setErrors(prev => ({
//           ...prev,
//           username: value.length < 3 
//             ? 'Username must be at least 3 characters long' 
//             : ''
//         }));
//         break;
      
//       case 'email':
//         const validDomains = ['@gmail.com', '@capgemini.com'];
//         const isValidDomain = validDomains.some(domain => value.toLowerCase().endsWith(domain));
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
//         setErrors(prev => ({
//           ...prev,
//           email: !value 
//             ? 'Email is required'
//             : !isValidDomain 
//             ? 'Email must end with @gmail.com or @capgemini.com'
//             : !emailRegex.test(value)
//             ? 'Please enter a valid email address'
//             : ''
//         }));
//         break;
      
//       case 'firstName':
//         setErrors(prev => ({
//           ...prev,
//           firstName: value.length < 2 
//             ? 'First name must be at least 2 characters long' 
//             : ''
//         }));
//         break;
      
//       case 'lastName':
//         setErrors(prev => ({
//           ...prev,
//           lastName: value.length < 2 
//             ? 'Last name must be at least 2 characters long' 
//             : ''
//         }));
//         break;
      
//       case 'password':
//         const passwordErrors = [];
//         if (value.length < 6 || value.length > 12) {
//           passwordErrors.push('Password must be between 6 and 12 characters');
//         }
//         if (!/\d/.test(value)) {
//           passwordErrors.push('Must contain at least one number');
//         }
//         if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
//           passwordErrors.push('Must contain at least one special character');
//         }
        
//         setErrors(prev => ({
//           ...prev,
//           password: passwordErrors.join('. ')
//         }));

//         // Also validate confirm password if it exists
//         if (formData.confirmPassword) {
//           validateField('confirmPassword', formData.confirmPassword);
//         }
//         break;
      
//       case 'confirmPassword':
//         setErrors(prev => ({
//           ...prev,
//           confirmPassword: value !== formData.password 
//             ? 'Passwords do not match' 
//             : ''
//         }));
//         break;
//     }
//   };

//   // Form submission handler
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Validate all fields
//     Object.keys(formData).forEach(key => {
//       validateField(key, formData[key]);
//     });

//     // Check if there are any errors
//     // const hasErrors = Object.values(errors).some(error => error !== '');
//     // const isFormFilled = Object.values(formData).every(value => value !== '');

//     // if (hasErrors || !isFormFilled) {
//     //   return;
//     // }

//     setIsSubmitting(true);

//     try {
//       const success = await signup(
//         formData.email, 
//         formData.password, 
//         formData.confirmPassword, 
//         formData.username, 
//         formData.firstName, 
//         formData.lastName
//       );
      
//       if (success) {
//         navigate('/dashboard');
//       }
//     } catch (signupError) {
//       console.error('Signup failed', signupError);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
//       <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
//         <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white">
//           Create Your Account
//         </h2>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           {/* Username */}
//           <div>
//             <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
//               Username
//             </label>
//             <input
//               type="text"
//               id="username"
//               name="username"
//               value={formData.username}
//               onChange={handleInputChange}
//               className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light dark:bg-gray-700 dark:text-white"
//               placeholder="Choose a username"
//             />
//             {errors.username && (
//               <p className="mt-1 text-sm text-red-500">{errors.username}</p>
//             )}
//           </div>

//           {/* Email */}
//           <div>
//             <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
//               Capgemini Email
//             </label>
//             <input
//               type="email"
//               id="email"
//               name="email"
//               value={formData.email}
//               onChange={handleInputChange}
//               className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light dark:bg-gray-700 dark:text-white"
//               placeholder="Enter your email"
//             />
//             {errors.email && (
//               <p className="mt-1 text-sm text-red-500">{errors.email}</p>
//             )}
//           </div>

//           {/* Name Fields */}
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
//                 First Name
//               </label>
//               <input
//                 type="text"
//                 id="firstName"
//                 name="firstName"
//                 value={formData.firstName}
//                 onChange={handleInputChange}
//                 className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light dark:bg-gray-700 dark:text-white"
//                 placeholder="First name"
//               />
//               {errors.firstName && (
//                 <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
//               )}
//             </div>
//             <div>
//               <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
//                 Last Name
//               </label>
//               <input
//                 type="text"
//                 id="lastName"
//                 name="lastName"
//                 value={formData.lastName}
//                 onChange={handleInputChange}
//                 className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light dark:bg-gray-700 dark:text-white"
//                 placeholder="Last name"
//               />
//               {errors.lastName && (
//                 <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
//               )}
//             </div>
//           </div>

//           {/* Password */}
//           <div>
//             <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
//               Password
//             </label>
//             <div className="relative">
//               <input
//                 type={showPassword ? "text" : "password"}
//                 id="password"
//                 name="password"
//                 value={formData.password}
//                 onChange={handleInputChange}
//                 className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light dark:bg-gray-700 dark:text-white pr-10"
//                 placeholder="Enter your password"
//               />
//               <button
//                 type="button"
//                 className="absolute inset-y-0 right-0 pr-3 flex items-center"
//                 onClick={() => setShowPassword(!showPassword)}
//               >
//                 {showPassword ? (
//                   <EyeOff className="h-5 w-5 text-gray-400" />
//                 ) : (
//                   <Eye className="h-5 w-5 text-gray-400" />
//                 )}
//               </button>
//             </div>
//             {errors.password && (
//               <p className="mt-1 text-sm text-red-500">{errors.password}</p>
//             )}
//             <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
//               6-12 characters, must include a number and special character
//             </p>
//           </div>

//           {/* Confirm Password */}
//           <div>
//             <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
//               Confirm Password
//             </label>
//             <div className="relative">
//               <input
//                 type={showConfirmPassword ? "text" : "password"}
//                 id="confirmPassword"
//                 name="confirmPassword"
//                 value={formData.confirmPassword}
//                 onChange={handleInputChange}
//                 className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light dark:bg-gray-700 dark:text-white pr-10"
//                 placeholder="Confirm your password"
//               />
//               <button
//                 type="button"
//                 className="absolute inset-y-0 right-0 pr-3 flex items-center"
//                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//               >
//                 {showConfirmPassword ? (
//                   <EyeOff className="h-5 w-5 text-gray-400" />
//                 ) : (
//                   <Eye className="h-5 w-5 text-gray-400" />
//                 )}
//               </button>
//             </div>
//             {errors.confirmPassword && (
//               <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
//             )}
//           </div>

//           {/* Submit Button */}
//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-light hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isSubmitting ? 'Creating Account...' : 'Sign Up'}
//           </button>
//         </form>

//         {/* Navigation to Sign In */}
//         <div className="mt-6 text-center">
//           <p className="text-sm text-gray-600 dark:text-gray-300">
//             Already have an account?{' '}
//             <button
//               onClick={() => navigate('/signin')}
//               className="text-primary-light hover:text-primary-dark font-medium"
//             >
//               Sign In
//             </button>
//           </p>
//         </div>

//         {/* Error Handling */}
//         {error && (
//           <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
//             {error}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SignUp;

// // import { useState } from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import { useAuth } from '../context/AuthContext';
// // import { Eye, EyeOff } from 'lucide-react';

// // const SignUp = () => {
// //   const [email, setEmail] = useState('');
// //   const [password, setPassword] = useState('');
// //   const [confirmPassword, setConfirmPassword] = useState('');
// //   const [isSubmitting, setIsSubmitting] = useState(false);
// //   const [passwordError, setPasswordError] = useState('');
// // const [confirmPasswordError, setConfirmPasswordError] = useState('');
// // // Add these with your other useState declarations
// // const [showPassword, setShowPassword] = useState(false);
// // const [showConfirmPassword, setShowConfirmPassword] = useState(false);
// // const [emailError, setEmailError] = useState('');
// //   const navigate = useNavigate();

// //   const { signup, error } = useAuth();

// //   const validateEmail = (email) => {
// //     if (!email) return 'Email is required';
    
// //     const validDomains = ['@gmail.com', '@capgemini.com'];
// //     const isValidDomain = validDomains.some(domain => email.toLowerCase().endsWith(domain));
    
// //     if (!isValidDomain) {
// //       return 'Email must end with @gmail.com or @capgemini.com';
// //     }
    
// //     // Basic email format validation
// //     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// //     if (!emailRegex.test(email)) {
// //       return 'Please enter a valid email address';
// //     }
    
// //     return '';
// //   };

// //   const validatePassword = (password) => {
// //     if (password.length < 6 || password.length > 12) {
// //       return 'Password must be between 6 and 12 characters';
// //     }
    
// //     const hasNumber = /\d/.test(password);
// //     const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
// //     if (!hasNumber) {
// //       return 'Password must contain at least one number';
// //     }
// //     if (!hasSpecialChar) {
// //       return 'Password must contain at least one special character';
// //     }
    
// //     return '';
// //   };

// //   const handlePasswordChange = (e) => {
// //     const newPassword = e.target.value;
// //     setPassword(newPassword);
// //     setPasswordError(validatePassword(newPassword));
    
// //     if (confirmPassword) {
// //       setConfirmPasswordError(
// //         newPassword !== confirmPassword ? 'Passwords do not match' : ''
// //       );
// //     }
// //   };

// //   const handleConfirmPasswordChange = (e) => {
// //     const newConfirmPassword = e.target.value;
// //     setConfirmPassword(newConfirmPassword);
// //     setConfirmPasswordError(
// //       newConfirmPassword !== password ? 'Passwords do not match' : ''
// //     );
// //   };

// //   const handleSubmit = async(e) => {
// //     e.preventDefault();
// //   // Validate password before submission

// //   const emailValidationError = validateEmail(email);
// //   if (emailValidationError) {
// //     setEmailError(emailValidationError);
// //     return;
// //   }

// //   const passwordValidationError = validatePassword(password);
// //   if (passwordValidationError) {
// //     setPasswordError(passwordValidationError);
// //     return;
// //   }
  
// //   // Check if passwords match
// //   if (password !== confirmPassword) {
// //     setConfirmPasswordError('Passwords do not match');
// //     return;
// //   }

// //     setIsSubmitting(true);

// //     try {
// //       console.log('Signup data:', { email, password, confirmPassword })
// //       const success = await signup(email, password, confirmPassword);
// //       if (success) {
// //         navigate('/dashboard');
// //       }
// //     } finally {
// //       setIsSubmitting(false);
// //     }
// //   };

// //   return (
// //     <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
// //       <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
// //         <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">Sign Up</h2>
        
// //         <form onSubmit={handleSubmit} className="space-y-6">
// //           <div>
// //             <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
// //               Capgemini Email ID
// //             </label>
// //             <input
// //               type="email"
// //               id="email"
// //               value={email}
// //               onChange={(e) => {
// //                 setEmail(e.target.value);
// //                 setEmailError(validateEmail(e.target.value));
// //               }}
// //               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light dark:bg-gray-700 dark:border-gray-600 dark:text-white"
// //               placeholder="Enter your email"
// //               required
// //             />
// //             {emailError && (
// //   <p className="mt-1 text-sm text-red-500">{emailError}</p>
// // )}
// //           </div>

// //           <div>
// //             <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
// //               Password
// //             </label>
// //             <div className="relative"> 
// //     <input
// //       type={showPassword ? "text" : "password"} 
// //       id="password"
// //       value={password}
// //       onChange={handlePasswordChange}
// //       className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light dark:bg-gray-700 dark:text-white pr-10"
// //       placeholder="Enter your password"
// //       required
// //     />
// //     <button
// //       type="button"
// //       className="absolute inset-y-0 right-0 pr-3 flex items-center"
// //       onClick={() => setShowPassword(!showPassword)}
// //     >
// //       {showPassword ? (
// //         <EyeOff className="h-5 w-5 text-gray-400" />
// //       ) : (
// //         <Eye className="h-5 w-5 text-gray-400" />
// //       )}
// //     </button>
// //   </div>
// //             {passwordError && (
// //               <p className="mt-1 text-sm text-red-500">{passwordError}</p>
// //             )}
// //             <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
// //               Password must be 6-12 characters long, contain at least one number and one special character.
// //             </p>
// //           </div>

// //           <div>
// //             <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
// //               Confirm Password
// //             </label>
// //             <div className="relative"> 
// //     <input
// //       type={showConfirmPassword ? "text" : "password"} 
// //       id="confirmPassword"
// //       value={confirmPassword}
// //       onChange={handleConfirmPasswordChange}
// //       className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light dark:bg-gray-700 dark:text-white pr-10"
// //       placeholder="Confirm your password"
// //       required
// //     />
// //     <button
// //       type="button"
// //       className="absolute inset-y-0 right-0 pr-3 flex items-center"
// //       onClick={() => setShowConfirmPassword(!showConfirmPassword)}
// //     >
// //       {showConfirmPassword ? (
// //         <EyeOff className="h-5 w-5 text-gray-400" />
// //       ) : (
// //         <Eye className="h-5 w-5 text-gray-400" />
// //       )}
// //     </button>
// //   </div>
// //             {confirmPasswordError && (
// //               <p className="mt-1 text-sm text-red-500">{confirmPasswordError}</p>
// //             )}
// //           </div>

// //           <div>
// //           <button
// //   type="submit"
// //   disabled={isSubmitting || emailError || passwordError || confirmPasswordError || !password || !confirmPassword || password !== confirmPassword}
// //   className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-light hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
// // >
// //   {isSubmitting ? 'Signing up...' : 'Sign Up'}
// // </button>
// //           </div>
// //         </form>

// //         <div className="mt-6">
// //           <button
// //             onClick={() => navigate('/signin')}
// //             className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-light bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
// //           >
// //             Already have an account
// //           </button>
// //         </div>

// //         <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
// //           <a href="#" className="text-primary-light hover:text-primary-dark">
// //             Need help?
// //           </a>
// //         </p>
// //       </div>
// //       {error && (
// //         <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
// //           {error}
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default SignUp;




import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const SignUp = () => {
  // Basic form fields
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });

  // Error states
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });

  // UI and submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const navigate = useNavigate();
  const { signup, error } = useAuth();

  // Generic input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate field as user types
    validateField(name, value);
  };

  // Validation methods
  const validateField = (name, value) => {
    switch(name) {
      case 'username':
        setErrors(prev => ({
          ...prev,
          username: value.length < 3 
            ? 'Username must be at least 3 characters long' 
            : ''
        }));
        break;
      
      case 'email':
        const validDomains = ['@gmail.com', '@capgemini.com'];
        const isValidDomain = validDomains.some(domain => value.toLowerCase().endsWith(domain));
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        setErrors(prev => ({
          ...prev,
          email: !value 
            ? 'Email is required'
            : !isValidDomain 
            ? 'Email must end with @gmail.com or @capgemini.com'
            : !emailRegex.test(value)
            ? 'Please enter a valid email address'
            : ''
        }));
        break;
      
      case 'firstName':
        setErrors(prev => ({
          ...prev,
          firstName: value.length < 2 
            ? 'First name must be at least 2 characters long' 
            : ''
        }));
        break;
      
      case 'lastName':
        setErrors(prev => ({
          ...prev,
          lastName: value.length < 2 
            ? 'Last name must be at least 2 characters long' 
            : ''
        }));
        break;
      
      case 'password':
        const passwordErrors = [];
        if (value.length < 6 || value.length > 12) {
          passwordErrors.push('Password must be between 6 and 12 characters');
        }
        if (!/\d/.test(value)) {
          passwordErrors.push('Must contain at least one number');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
          passwordErrors.push('Must contain at least one special character');
        }
        
        setErrors(prev => ({
          ...prev,
          password: passwordErrors.join('. ')
        }));

        // Also validate confirm password if it exists
        if (formData.confirmPassword) {
          validateField('confirmPassword', formData.confirmPassword);
        }
        break;
      
      case 'confirmPassword':
        setErrors(prev => ({
          ...prev,
          confirmPassword: value !== formData.password 
            ? 'Passwords do not match' 
            : ''
        }));
        break;
    }
  };

  // Form validation check
  const isFormValid = () => {
    // Validate all fields first
    Object.keys(formData).forEach(key => {
      if (key !== 'visibility') { // Skip validating visibility
        validateField(key, formData[key]);
      }
    });
    
    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error !== '');
    
    // Check if required fields are filled
    const requiredFields = ['username', 'email', 'password', 'confirmPassword'];
    const isFormFilled = requiredFields.every(field => formData[field] !== '');
    
    return !hasErrors && isFormFilled;
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!isFormValid()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await signup(
        formData.email, 
        formData.password, 
        formData.confirmPassword, 
        formData.username, 
        formData.firstName, 
        formData.lastName
      );
      
      if (success) {
        navigate('/dashboard');
      }
    } catch (signupError) {
      console.error('Signup failed', signupError);
      setApiError(signupError.message || 'An error occurred during signup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white">
          Create Your Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light dark:bg-gray-700 dark:text-white"
              placeholder="Choose a username"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-500">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Capgemini Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light dark:bg-gray-700 dark:text-white"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light dark:bg-gray-700 dark:text-white"
                placeholder="First name"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light dark:bg-gray-700 dark:text-white"
                placeholder="Last name"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light dark:bg-gray-700 dark:text-white pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              6-12 characters, must include a number and special character
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light dark:bg-gray-700 dark:text-white pr-10"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-light hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Navigation to Sign In */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/signin')}
              className="text-primary-light hover:text-primary-dark font-medium"
            >
              Sign In
            </button>
          </p>
        </div>

        {/* Error Handling */}
        {(error || apiError) && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error || apiError}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUp;