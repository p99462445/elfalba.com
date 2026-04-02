import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os
import glob
import shutil

print("\n" + "="*50)
print("### 봇 버전: v4.0 (최종 통합 패치) ###")
print("="*50 + "\n")

# ==========================================
# 🚀 봇 구동 로직
# ==========================================
def run_bot():
    print("📋 바탕화면의 '공고번호.xlsx' 파일을 읽어오는 중...")
    try:
        # 사용자 지정 절대 경로
        target_excel = r"C:\Users\박근홍\Desktop\악녀디비\공고번호.xlsx"
        df = pd.read_excel(target_excel)
        job_numbers = df.iloc[:, 0].dropna().astype(str).tolist()
    except Exception as e:
        print(f"❌ 엑셀 읽기 실패: {e}")
        return

    print(f"✅ 총 {len(job_numbers)}개의 번호를 발견했습니다. 크롬을 시작합니다.\n")

    # 다운로드용 임시 폴더
    download_dir = os.path.abspath("downloads_rpa")
    if os.path.exists(download_dir): shutil.rmtree(download_dir)
    os.makedirs(download_dir)

    prefs = {"download.default_directory": download_dir}
    options = webdriver.ChromeOptions()
    options.add_experimental_option("prefs", prefs)
    
    driver = webdriver.Chrome(options=options)

    try:
        # 로그인 페이지 접속
        driver.get("http://horsehp1.1step.co.kr/admin/sub_login/login_form.htm")
        
        print("🔔 [안내] 수동 로그인 후 '채용공고 관리' 페이지까지 들어가 주세요.")
        print("   (검색창이 있는 화면이 뜨면 봇이 자동으로 알아차립니다.)\n")

        # [필독] 올바른 작업 프레임을 찾는 함수
        def switch_to_work_frame():
            driver.switch_to.default_content()
            # 1step 솔루션은 보통 2번째 프레임이나 'main_frame' 등에 검색창이 있습니다.
            frames = driver.find_elements(By.TAG_NAME, "frame")
            for idx in range(len(frames)):
                driver.switch_to.default_content()
                driver.switch_to.frame(idx)
                # 검색창 이름(search_keyword) 혹은 특정 버튼 텍스트로 현재 페이지 확인
                if len(driver.find_elements(By.NAME, "search_keyword")) > 0 or "선택한 공고 엑셀 받기" in driver.page_source:
                    return True, idx
            return False, -1

        # 작업 화면 대기 모드
        work_frame_idx = -1
        while True:
            found, idx = switch_to_work_frame()
            if found:
                print(f"✨ [감지 성공] {idx}번 프레임에서 작업 화면을 찾았습니다! 작업을 시작합니다.")
                work_frame_idx = idx
                break
            time.sleep(2)

        # ----------------------------------
        # 반복 자동화 본격 가동
        # ----------------------------------
        success_count = 0
        for index, job_no in enumerate(job_numbers, start=1):
            print(f"[{index}/{len(job_numbers)}] '{job_no}' 처리 시도중...")
            
            try:
                # 1. 프레임 재설정 (매 루프마다 안전하게)
                driver.switch_to.default_content()
                driver.switch_to.frame(work_frame_idx)

                # 2. 검색어 입력 (name='search_keyword')
                search_input = WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.NAME, "search_keyword"))
                )
                search_input.clear()
                search_input.send_keys(job_no)
                
                # 3. 검색 버튼 클릭
                # (1step의 검색버튼은 보통 name='search' 인 input 혹은 특정 텍스트 버튼)
                try:
                    search_btn = driver.find_element(By.XPATH, "//*[contains(translate(text(),' ',''),'검색')]")
                except:
                    search_btn = driver.find_element(By.CSS_SELECTOR, "input[type='image'], input[value='검색']")
                
                driver.execute_script("arguments[0].click();", search_btn)
                time.sleep(1.5) # 검색 로딩 대기
                
                # 4. 전체 선택 (첫 번째 체크박스)
                checkboxes = driver.find_elements(By.CSS_SELECTOR, "input[type='checkbox']")
                if checkboxes:
                    driver.execute_script("arguments[0].click();", checkboxes[0])
                time.sleep(0.5)
                
                # 5. 엑셀 다운로드 클릭
                download_btn = driver.find_element(By.XPATH, "//*[contains(translate(text(),' ',''),'선택한공고엑셀받기')]")
                driver.execute_script("arguments[0].click();", download_btn)
                
                time.sleep(2) # 다운로드 대기
                success_count += 1
                
            except Exception as e:
                print(f"  ❌ '{job_no}' 작업 실패 (건너뜀)")
                # 화면이 꼬이면 새로고침 후 프레임 다시 잡기
                driver.refresh()
                time.sleep(3)
                switch_to_work_frame() # 프레임 재위치
                continue

        print(f"\n🎉 다운로드 작업이 끝났습니다! (성공: {success_count}건)")

        # ----------------------------------
        # 엑셀 병합 작업
        # ----------------------------------
        print("\n🔄 낱개 엑셀 파일들을 하나로 합치는 중...")
        time.sleep(5)
        all_files = glob.glob(os.path.join(download_dir, "*.xls*"))
        df_list = []
        for f in all_files:
            try:
                # 1step 솔루션의 .xls는 내부가 HTML인 경우가 많음
                try: df = pd.read_excel(f)
                except: df = pd.read_html(f, encoding='utf-8')[0]
                df_list.append(df)
            except: pass
            
        if df_list:
            final_df = pd.concat(df_list, ignore_index=True)
            output_file = "최종_완성된_공고모음.xlsx"
            final_df.to_excel(output_file, index=False)
            print(f"✅ '{output_file}' 파일이 현재 폴더에 생성되었습니다!")
            shutil.rmtree(download_dir)
        else:
            print("❌ 병합할 파일을 찾지 못했습니다.")

    finally:
        print("\n■ 모든 작업 종료. 5초 뒤 창을 닫습니다.")
        time.sleep(5)
        try: driver.quit()
        except: pass

if __name__ == "__main__":
    run_bot()
