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

# ==========================================
# ⚙️ 1. 기본 설정
# ==========================================
LOGIN_URL = "http://horsehp1.1step.co.kr/admin/sub_login/login_form.htm"

SITE_ID = "horsehp1"
ADMIN_ID = "root"
ADMIN_PW = "1q2w3e4r!!"

# ==========================================
# 🚀 2. 봇 구동 로직
# ==========================================
def run_bot():
    print("📋 바탕화면의 '공고번호.xlsx' 파일을 읽어오는 중...")
    try:
        # 엑셀 파일 지정 경로
        df = pd.read_excel(r"C:\Users\박근홍\Desktop\악녀디비\공고번호.xlsx")
        job_numbers = df.iloc[:, 0].dropna().astype(str).tolist()
    except Exception as e:
        print(f"❌ 엑셀 파일을 찾을 수 없습니다: {e}")
        return

    print(f"✅ 총 {len(job_numbers)}개의 공고번호를 발견했습니다. 크롬을 시작합니다.\n")

    download_dir = os.path.abspath("downloads")
    if not os.path.exists(download_dir):
        os.makedirs(download_dir)

    prefs = {"download.default_directory": download_dir}
    options = webdriver.ChromeOptions()
    options.add_experimental_option("prefs", prefs)
    
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 10)

    try:
        # [1단계] 로그인
        print("▶ 로그인 페이지 접속 중...")
        driver.get(LOGIN_URL)
        time.sleep(2)
        
        inputs = driver.find_elements(By.TAG_NAME, "input")
        inputs[0].clear()
        inputs[0].send_keys(SITE_ID)
        
        inputs[1].clear()
        inputs[1].send_keys(ADMIN_ID)
        
        pw_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        pw_input.clear()
        pw_input.send_keys(ADMIN_PW)
        
        try:
            driver.find_element(By.XPATH, "//*[contains(text(), '로그인')]").click()
        except:
            pw_input.send_keys(Keys.ENTER)
            
        print("🔓 로그인 시도 완료. 메인 화면 진입 대기...")
        time.sleep(4)

        # [2단계] 채용공고 관리 메뉴 진입
        print("▶ '구인구직2.0' 메뉴 클릭 시도...")
        try:
            frames = driver.find_elements(By.TAG_NAME, "frame")
            if len(frames) > 0:
                driver.switch_to.frame(frames[0])
                
            wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), '구인구직2.0')]"))).click()
            time.sleep(1)
            wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), '채용공고 관리') or contains(text(), '채용공고관리')]"))).click()
            time.sleep(3)
        except Exception as e:
            print("⚠️ 자동 메뉴 클릭 실패. 관리자 창의 구조가 다릅니다. (진행은 계속됩니다)")

        driver.switch_to.default_content() 
        frames = driver.find_elements(By.TAG_NAME, "frame")
        if len(frames) > 1:
            driver.switch_to.frame(frames[1])
        elif len(frames) == 1:
            driver.switch_to.frame(frames[0])

        # [3단계] 반복 검색 및 엑셀 다운로드
        success_count = 0
        for index, job_no in enumerate(job_numbers, start=1):
            print(f"[{index}/{len(job_numbers)}] 검색 진행 중: 공고번호 '{job_no}' ...")
            try:
                # 1) 검색어 입력칸 찾기 (가장 마지막 input text)
                text_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='text']")
                search_box = text_inputs[-1] 
                
                search_box.clear()
                search_box.send_keys(job_no)
                
                # 2) 검색 버튼 (공백 없는 텍스트 포함 조건으로 안전하게 탐색)
                driver.find_element(By.XPATH, "//*[contains(translate(text(), ' ', ''), '검색')]").click()
                time.sleep(1.5)
                
                # 3) '맨 왼쪽 네모 버튼' (전체 선택 체크박스) 클릭
                checkboxes = driver.find_elements(By.CSS_SELECTOR, "input[type='checkbox']")
                if len(checkboxes) > 0:
                    checkboxes[0].click()
                time.sleep(0.5)
                
                # 4) 엑셀 받기 클릭
                excel_btn = driver.find_element(By.XPATH, "//*[contains(translate(text(), ' ', ''), '선택한공고엑셀받기')]")
                excel_btn.click()
                
                time.sleep(2) # 다운로드 위해 대기
                success_count += 1
                
            except Exception as e:
                print(f"  ❌ 공고번호 '{job_no}' 다운로드 오류 (예: 검색결과 없음)")
                driver.refresh()
                time.sleep(3)
                continue

        print(f"\n🎉 봇 다운로드 작업 완료! (총 {len(job_numbers)}개 중 {success_count}개 파일 다운로드 완료)")

        # [4단계] 여러 개의 엑셀을 한 개로 합치고 청소하기
        print("\n🔄 수십 개의 엑셀 파일을 하나의 '마스터 엑셀'로 줄바꿈하며 합칩니다...")
        time.sleep(3) # 다운로드가 끝날 여유시간 대기
        
        all_files = glob.glob(os.path.join(download_dir, "*.xls*"))
        df_list = []
        
        for file in all_files:
            try:
                # 1step 솔루션의 .xls는 내부가 HTML인 경우가 많습니다. 둘 다 시도합니다.
                try:
                    df = pd.read_excel(file)
                except:
                    # 'encoding=cp949' 나 'utf-8' 등 한글 깨짐 방지용으로 HTML 읽기
                    df = pd.read_html(file, encoding='utf-8')[0]
                df_list.append(df)
            except Exception as e:
                print(f"  ⚠️ {os.path.basename(file)} 파일 파싱 실패, 건너뜀")

        if df_list:
            final_df = pd.concat(df_list, ignore_index=True)
            final_df.to_excel("최종_완성된_공고모음.xlsx", index=False)
            print("✅ '최종_완성된_공고모음.xlsx' 파일이 생성되었습니다!")
            
            # 쓸모없어진 개별 엑셀 파일들(폴더째) 과감히 삭제
            try:
                 shutil.rmtree(download_dir)
                 print("✅ 불필요한 낱개 엑셀 파일들을 깔끔하게 삭제했습니다.")
            except:
                 pass
        else:
            print("❌ 병합할 파일이 존재하지 않습니다.")

    finally:
        print("\n■ 모든 작업이 종료되었습니다. 5초 뒤 크롬 창이 닫힙니다.")
        time.sleep(5)
        try:
           driver.quit()
        except:
           pass

if __name__ == "__main__":
    run_bot()
