export const intersection = (A, B, C, D, tol = 0.000001) => {
    if(Math.abs((A[0] - B[0]) * (C[1] - D[1]) - (A[1] - B[1]) * (B[0] - D[0])) <= tol){
        return NaN;
    }
    else if(Math.abs(((A[0] - B[0]) * (C[1] - D[1]) - (A[1] - B[1]) * (C[0] - D[0]))) <= tol){
        return NaN;
    }
    return [
      ((A[0] * B[1] - A[1] * B[0]) * (C[0] - D[0]) - (A[0] - B[0]) * (C[0] * D[1] - C[1] * D[0])) /
        ((A[0] - B[0]) * (C[1] - D[1]) - (A[1] - B[1]) * (B[0] - D[0])),
      ((A[0] * B[1] - A[1] * B[0]) * (C[1] - D[1]) - (A[1] - B[1]) * (C[0] * D[1] - C[1] * D[0])) /
        ((A[0] - B[0]) * (C[1] - D[1]) - (A[1] - B[1]) * (C[0] - D[0])),
    ]
}